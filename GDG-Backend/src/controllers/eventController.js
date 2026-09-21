const { supabaseAdmin } = require('../config/supabase');
const { logActivity } = require('../services/activityLogService');
const { BoundedMap } = require('../utils/boundedCache');
const PosterStorageService = require('../services/posterStorageService');

// In-memory bounded cache for high-traffic event reads (capped to 200 items for Render 512MB RAM)
const EVENT_CACHE_TTL = 60 * 1000; // 60 seconds (cuts Supabase egress)
let eventsListCache = { data: null, expiresAt: 0 };
const singleEventCache = new BoundedMap(200); // id -> { data, expiresAt }

const invalidateEventCache = (eventId = null) => {
  eventsListCache = { data: null, expiresAt: 0 };
  if (eventId) {
    singleEventCache.delete(eventId);
  } else {
    singleEventCache.clear();
  }
};

/**
 * POST /api/events
 * Admin-only: Create a new event.
 */
const createEvent = async (req, res) => {
  try {
    const { title, details } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        error: 'Validation error: title is required and must be a non-empty string.',
      });
    }

    let eventDetails = details && typeof details === 'object' ? details : {};
    // Automatically sanitize and upload any Base64 encoded poster bytes to storage bucket
    eventDetails = await PosterStorageService.sanitizeEventDetails(eventDetails);

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .insert([
        {
          title: title.trim(),
          details: eventDetails,
          created_by: req.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Create Event Error:', error);
      return res.status(500).json({
        error: 'Failed to create event.',
        details: error.message,
      });
    }

    // Invalidate event cache on modification
    invalidateEventCache();

    // Log the event_created activity
    await logActivity(req, {
      user_id: req.user.id,
      action: 'event_created',
      details: { event_id: event.id, title: event.title },
    });

    return res.status(201).json({
      message: 'Event created successfully.',
      event,
    });
  } catch (error) {
    console.error('createEvent controller error:', error);
    return res.status(500).json({
      error: 'Internal server error while creating event.',
    });
  }
};

// Single-Flight Request Coalescing (Prevents Thundering Herd / Cache Stampede)
let eventsListInflightPromise = null;
const singleEventInflightPromises = new BoundedMap(100);

/**
 * GET /api/events
 * Authenticated: List all club events (read-only for students, full access for admins).
 * Shielded by in-memory TTL cache and single-flight coalescing to handle thundering herd traffic.
 */
const listEvents = async (req, res) => {
  try {
    const now = Date.now();
    const queryLimit = parseInt(req.query.limit, 10) || 100;

    // Egress optimization: browser & CDN caching headers
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');

    // Fast-path: return cached list for standard queries
    if (queryLimit === 100 && eventsListCache.data && eventsListCache.expiresAt > now) {
      return res.status(200).json({
        message: 'Events fetched successfully.',
        count: eventsListCache.data.length,
        events: eventsListCache.data,
        cached: true,
      });
    }

    // Single-Flight: Coalesce all simultaneous requests into a SINGLE database call
    let events;
    if (eventsListInflightPromise) {
      events = await eventsListInflightPromise;
    } else {
      eventsListInflightPromise = (async () => {
        let query = supabaseAdmin
          .from('events')
          .select('id, title, details, created_by, created_at, updated_at')
          .order('created_at', { ascending: false });

        if (typeof query.limit === 'function') {
          query = query.limit(queryLimit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      })();

      try {
        events = await eventsListInflightPromise;
      } catch (dbErr) {
        console.warn('Events query timed out or failed (single-flight):', dbErr.message);
        if (eventsListCache.data) {
          return res.status(200).json({
            message: 'Events fetched (stale cache fallback).',
            count: eventsListCache.data.length,
            events: eventsListCache.data,
            warning: 'Database under high load; showing cached events.',
          });
        }
        return res.status(200).json({
          message: 'Events fetched (degraded mode).',
          count: 0,
          events: [],
          warning: dbErr.message,
        });
      } finally {
        eventsListInflightPromise = null;
      }
    }

    const resultEvents = events || [];

    // Cache default queries
    if (queryLimit === 100) {
      eventsListCache = {
        data: resultEvents,
        expiresAt: now + EVENT_CACHE_TTL,
      };
    }

    return res.status(200).json({
      message: 'Events fetched successfully.',
      count: resultEvents.length,
      events: resultEvents,
    });
  } catch (error) {
    console.error('listEvents controller error:', error);
    if (eventsListCache.data) {
      return res.status(200).json({
        message: 'Events fetched (cache fallback).',
        count: eventsListCache.data.length,
        events: eventsListCache.data,
      });
    }
    return res.status(500).json({
      error: 'Internal server error while fetching events.',
    });
  }
};

/**
 * GET /api/events/:id
 * Authenticated: Get a single event by ID.
 * Shielded by in-memory TTL cache and single-flight coalescing.
 */
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const now = Date.now();

    const cached = singleEventCache.get(id);
    if (cached && cached.expiresAt > now) {
      return res.status(200).json({
        message: 'Event retrieved successfully.',
        event: cached.data,
        cached: true,
      });
    }

    let event;
    if (singleEventInflightPromises.has(id)) {
      event = await singleEventInflightPromises.get(id);
    } else {
      const fetchPromise = (async () => {
        const { data, error } = await supabaseAdmin
          .from('events')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      })();

      singleEventInflightPromises.set(id, fetchPromise);
      try {
        event = await fetchPromise;
      } catch (err) {
        console.warn(`Event ${id} fetch error:`, err.message);
      } finally {
        singleEventInflightPromises.delete(id);
      }
    }

    if (!event) {
      if (cached && cached.data) {
        return res.status(200).json({
          message: 'Event retrieved (cache fallback).',
          event: cached.data,
        });
      }
      return res.status(404).json({
        error: 'Event not found.',
      });
    }

    singleEventCache.set(id, {
      data: event,
      expiresAt: now + EVENT_CACHE_TTL,
    });

    return res.status(200).json({
      message: 'Event retrieved successfully.',
      event,
    });
  } catch (error) {
    console.error('getEventById controller error:', error);
    const cached = singleEventCache.get(req.params.id);
    if (cached && cached.data) {
      return res.status(200).json({
        message: 'Event retrieved (cache fallback).',
        event: cached.data,
      });
    }
    return res.status(500).json({
      error: 'Internal server error while fetching event.',
    });
  }
};

/**
 * PUT /api/events/:id
 * Admin-only: Update an existing event.
 */
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, details } = req.body;

    const updatePayload = {
      updated_at: new Date().toISOString(),
    };

    if (title && typeof title === 'string' && title.trim()) {
      updatePayload.title = title.trim();
    }

    if (details && typeof details === 'object') {
      updatePayload.details = await PosterStorageService.sanitizeEventDetails(details, id);
    }

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !event) {
      return res.status(404).json({
        error: 'Event not found or failed to update.',
        details: error ? error.message : undefined,
      });
    }

    // Invalidate cache for this event and the list
    invalidateEventCache(id);

    // Log the event_updated activity
    await logActivity(req, {
      user_id: req.user.id,
      action: 'event_updated',
      details: { event_id: event.id, title: event.title },
    });

    return res.status(200).json({
      message: 'Event updated successfully.',
      event,
    });
  } catch (error) {
    console.error('updateEvent controller error:', error);
    return res.status(500).json({
      error: 'Internal server error while updating event.',
    });
  }
};

/**
 * POST /api/events/upload-poster
 * Admin-only: Uploads an event poster image directly to the Supabase Storage bucket.
 */
const uploadEventPoster = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation error: image file is required.',
      });
    }

    const { eventId } = req.body;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: `Invalid file type '${req.file.mimetype}'. Allowed types: JPEG, PNG, WebP, GIF.`,
      });
    }

    const result = await PosterStorageService.uploadPosterBuffer({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      eventId: eventId || 'event',
      originalName: req.file.originalname,
    });

    return res.status(200).json({
      message: 'Event poster uploaded successfully to storage bucket.',
      url: result.publicUrl,
      path: result.path,
    });
  } catch (error) {
    console.error('uploadEventPoster error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to upload event poster to storage bucket.',
    });
  }
};

/**
 * POST /api/events/migrate-posters
 * Admin-only: Scans events and migrates any Base64-encoded posters to Supabase Storage bucket URLs.
 */
const migrateBase64Posters = async (req, res) => {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('id, title, details');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch events for migration.' });
    }

    let migratedCount = 0;
    const detailsResults = [];

    for (const ev of events || []) {
      const details = ev.details || {};
      const hasBase64Banner = details.banner_url && typeof details.banner_url === 'string' && details.banner_url.startsWith('data:');
      const hasBase64Cover = details.coverImage && typeof details.coverImage === 'string' && details.coverImage.startsWith('data:');

      if (hasBase64Banner || hasBase64Cover) {
        const sanitized = await PosterStorageService.sanitizeEventDetails(details, ev.id);
        const { error: updateErr } = await supabaseAdmin
          .from('events')
          .update({ details: sanitized, updated_at: new Date().toISOString() })
          .eq('id', ev.id);

        if (!updateErr) {
          migratedCount++;
          detailsResults.push({ id: ev.id, title: ev.title, new_url: sanitized.banner_url });
        }
      }
    }

    if (migratedCount > 0) {
      invalidateEventCache();
    }

    return res.status(200).json({
      message: `Migration complete. ${migratedCount} events updated with storage bucket URLs.`,
      migratedCount,
      events: detailsResults,
    });
  } catch (error) {
    console.error('migrateBase64Posters error:', error);
    return res.status(500).json({ error: error.message || 'Migration failed.' });
  }
};

/**
 * DELETE /api/events/:id
 * Admin-only: Delete an event by ID.
 */
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error || !event) {
      return res.status(404).json({
        error: 'Event not found or already deleted.',
      });
    }

    // Invalidate cache for this event and the list
    invalidateEventCache(id);

    // Log the event_deleted activity
    await logActivity(req, {
      user_id: req.user.id,
      action: 'event_deleted',
      details: { event_id: id, title: event.title },
    });

    return res.status(200).json({
      message: 'Event deleted successfully.',
      deleted_event: event,
    });
  } catch (error) {
    console.error('deleteEvent controller error:', error);
    return res.status(500).json({
      error: 'Internal server error while deleting event.',
    });
  }
};

module.exports = {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  uploadEventPoster,
  migrateBase64Posters,
  invalidateEventCache,
};
