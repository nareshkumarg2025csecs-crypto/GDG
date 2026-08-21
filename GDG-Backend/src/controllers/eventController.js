const { supabaseAdmin } = require('../config/supabase');
const { logActivity } = require('../services/activityLogService');

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

    const eventDetails = details && typeof details === 'object' ? details : {};

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

/**
 * GET /api/events
 * Authenticated: List all club events (read-only for students, full access for admins).
 */
const listEvents = async (req, res) => {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('List Events Error:', error);
      return res.status(500).json({
        error: 'Failed to fetch events.',
        details: error.message,
      });
    }

    return res.status(200).json({
      message: 'Events fetched successfully.',
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('listEvents controller error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching events.',
    });
  }
};

/**
 * GET /api/events/:id
 * Authenticated: Get a single event by ID.
 */
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !event) {
      return res.status(404).json({
        error: 'Event not found.',
      });
    }

    return res.status(200).json({
      message: 'Event retrieved successfully.',
      event,
    });
  } catch (error) {
    console.error('getEventById controller error:', error);
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
      updatePayload.details = details;
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
};
