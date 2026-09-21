const { supabaseAdmin } = require('../config/supabase');
const { BoundedMap } = require('../utils/boundedCache');
const { invalidateAuthCache } = require('../middleware/auth');

// In-memory notifications cache (TTL: 60s, capped to 500 users) to eliminate repetitive PostgREST queries and reduce Supabase egress
const NOTIF_CACHE_TTL = 60 * 1000;
const notificationsCache = new BoundedMap(500);

/**
 * GET /api/dashboard
 * Authenticated: Get the current user's profile and dynamic dashboard details.
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, details, created_at')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        error: 'Dashboard profile not found.',
      });
    }

    return res.status(200).json({
      message: 'Dashboard retrieved successfully.',
      dashboard: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        created_at: profile.created_at,
        details: profile.details || {},
      },
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching dashboard.',
    });
  }
};

/**
 * PUT /api/dashboard
 * Authenticated: Update current user's own profile and JSONB details.
 *
 * CRITICAL SECURITY ENFORCEMENT:
 * Strips `role`, `email`, and `id` from req.body to prevent privilege escalation
 * and unauthorized identifier changes. Only `full_name` and `details` (JSONB) are updatable.
 */
const updateDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, details } = req.body;

    const updatePayload = {};

    if (full_name && typeof full_name === 'string' && full_name.trim()) {
      updatePayload.full_name = full_name.trim();
    }

    if (details && typeof details === 'object' && !Array.isArray(details)) {
      // Fetch latest existing details from database to merge cleanly
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('details')
        .eq('id', userId)
        .single();

      const currentDetails = existingProfile?.details || {};
      updatePayload.details = {
        ...currentDetails,
        ...details,
      };
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        error: 'No valid update fields provided. You may update full_name and details.',
      });
    }

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, email, full_name, role, details, created_at')
      .single();

    if (error || !updatedProfile) {
      return res.status(500).json({
        error: 'Failed to update dashboard profile.',
        details: error ? error.message : undefined,
      });
    }

    // Invalidate caches so next request retrieves fresh profile
    invalidateAuthCache(userId);
    notificationsCache.delete(userId);

    return res.status(200).json({
      message: 'Dashboard updated successfully.',
      dashboard: updatedProfile,
    });
  } catch (error) {
    console.error('updateDashboard error:', error);
    return res.status(500).json({
      error: 'Internal server error while updating dashboard.',
    });
  }
};

/**
 * GET /api/dashboard/notifications
 * Authenticated: Synthesizes real-time user notifications:
 * - Attendance verification (when marked present)
 * - Certificate dispatch (when certificate email is sent)
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = Date.now();

    // Fast-path: return cached notifications if within TTL (cuts Supabase egress)
    const cached = notificationsCache.get(userId);
    if (cached && cached.expiresAt > now) {
      return res.status(200).json(cached.data);
    }

    // Fetch user submissions with related forms and events (limit to recent 25 to prevent statement timeouts)
    // Egress optimization: select only events(id, title) - omitting heavy `details` jsonb payload
    const { data: submissions, error: subError } = await supabaseAdmin
      .from('form_submissions')
      .select('id, form_id, user_id, answers, attended, submitted_at, ticket_id, certificate_sent, certificate_sent_at, certificate_id, forms(id, title, event_id, events(id, title))')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(25);

    if (subError) {
      console.warn('getUserNotifications submissions query returned non-critical notice:', subError.message);
    }

    const notifications = [];

    if (submissions && submissions.length > 0) {
      for (const sub of submissions) {
        const eventTitle = sub.forms?.events?.title || sub.forms?.title || 'GDG Event';
        const eventId = sub.forms?.events?.id || sub.forms?.event_id || null;

        // 1. Attendance Notification (when user marked present)
        if (sub.attended) {
          const attendedTime = sub.answers?.attended_at || sub.submitted_at;
          notifications.push({
            id: `attendance_${sub.id}`,
            type: 'attendance',
            title: 'Attendance Marked Present',
            message: `You were marked present for "${eventTitle}". Your attendance has been verified!`,
            timestamp: attendedTime,
            event_id: eventId,
            event_title: eventTitle,
            action_url: '/dashboard',
            metadata: {
              submission_id: sub.id,
              ticket_id: sub.ticket_id || sub.answers?.ticket_id,
            },
          });
        }

        // 2. Certificate Sent Notification (when certificate email dispatched)
        if (sub.certificate_sent) {
          const sentTime = sub.certificate_sent_at || sub.submitted_at;
          notifications.push({
            id: `certificate_${sub.id}`,
            type: 'certificate',
            title: 'Certificate Dispatched & Sent',
            message: `Your certificate of participation for "${eventTitle}" has been generated and sent to your email.`,
            timestamp: sentTime,
            event_id: eventId,
            event_title: eventTitle,
            certificate_id: sub.certificate_id,
            action_url: '/dashboard',
            metadata: {
              submission_id: sub.id,
              certificate_id: sub.certificate_id,
            },
          });
        }
      }
    }

    // Sort descending by timestamp
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const responsePayload = {
      success: true,
      count: notifications.length,
      notifications,
    };

    // Store in cache for 30 seconds
    notificationsCache.set(userId, {
      data: responsePayload,
      expiresAt: now + NOTIF_CACHE_TTL,
    });

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('getUserNotifications error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve notifications.',
    });
  }
};

module.exports = {
  getDashboard,
  updateDashboard,
  getUserNotifications,
};

