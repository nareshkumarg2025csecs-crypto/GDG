const { supabase, supabaseAdmin } = require('../config/supabase');
const GoogleCalendarService = require('../services/googleCalendarService');

/**
 * POST /api/events/:eventId/calendar-reminder
 * Authenticated: Add an event reminder to the user's Google Calendar.
 *
 * BRANCHING LOGIC:
 * 1. Checks whether the requesting user already has a linked Google identity / Google tokens.
 * 2. If LINKED: creates the event directly in Google Calendar and confirms success.
 * 3. If NOT LINKED (e.g. signed up with email/password only): returns a structured response
 *    instructing the frontend to prompt "Connect Google Calendar" first.
 */
const createEventReminder = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // 1. Verify event exists
    const { data: event, error: eventErr } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventErr || !event) {
      return res.status(404).json({
        error: 'Event not found.',
      });
    }

    // 2. Check if user has a linked Google identity and access token
    const { isLinked, tokenData } = await GoogleCalendarService.checkUserGoogleLink(userId);

    if (!isLinked || !tokenData || !tokenData.access_token) {
      // User is authenticated via email+password without Google calendar link
      return res.status(200).json({
        connected: false,
        action_required: 'CONNECT_GOOGLE_CALENDAR',
        message:
          'Google Calendar is not connected. Please connect your Google account first to enable calendar reminders.',
        connect_endpoint: '/api/auth/google/link',
      });
    }

    // 3. Obtain valid / refreshed access token
    const validAccessToken = await GoogleCalendarService.getValidAccessToken(userId);

    if (!validAccessToken) {
      return res.status(200).json({
        connected: false,
        action_required: 'RECONNECT_GOOGLE_CALENDAR',
        message: 'Google Calendar authorization expired. Please reconnect your Google account.',
        connect_endpoint: '/api/auth/google/link',
      });
    }

    // 4. Create event in user's primary Google Calendar
    try {
      const calendarEvent = await GoogleCalendarService.insertCalendarEvent(validAccessToken, event);

      // 5. Persist server-side added state in user_calendar_events table
      try {
        await supabaseAdmin
          .from('user_calendar_events')
          .upsert(
            {
              user_id: userId,
              event_id: eventId,
              calendar_event_id: calendarEvent.id || null,
              created_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,event_id' }
          );
      } catch (dbErr) {
        console.warn('Could not persist user_calendar_events record:', dbErr.message);
      }

      return res.status(200).json({
        success: true,
        connected: true,
        message: 'Event successfully added to your Google Calendar.',
        event_title: event.title,
        calendar_event_id: calendarEvent.id,
        calendar_event_link: calendarEvent.htmlLink,
      });
    } catch (calError) {
      console.error('Google Calendar insertion error:', calError);
      return res.status(502).json({
        error: 'Failed to insert event into Google Calendar.',
        details: calError.message,
      });
    }
  } catch (error) {
    console.error('createEventReminder error:', error);
    return res.status(500).json({
      error: 'Internal server error while creating calendar reminder.',
    });
  }
};

/**
 * GET /api/auth/google/link
 * Authenticated: Returns the Google OAuth URL with Calendar scopes for linking to an existing account.
 *
 * NOTE: supabase.auth.linkIdentity() is a BROWSER-SIDE SDK method that requires an active
 * browser session — it cannot be called server-side without a session context.
 * Instead we construct the Supabase OAuth redirect URL directly.
 */
const getGoogleLinkUrl = async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:8081';

    if (!supabaseUrl) {
      return res.status(500).json({ error: 'Server misconfiguration: SUPABASE_URL is not set.' });
    }

    // Build the Supabase Google OAuth redirect URL with calendar scopes.
    // This works for BOTH email+password users (link_identity=true flag) and existing Google users.
    const redirectTo = encodeURIComponent(`${clientUrl}/auth/callback?link_identity=true`);
    const scopes = encodeURIComponent(
      'email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar'
    );

    // Supabase's authorize endpoint for providers
    const oauthUrl =
      `${supabaseUrl}/auth/v1/authorize` +
      `?provider=google` +
      `&scopes=${scopes}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&redirect_to=${redirectTo}`;

    return res.status(200).json({
      message: 'Google identity linking URL generated.',
      url: oauthUrl,
      provider: 'google',
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar',
      ],
    });
  } catch (error) {
    console.error('getGoogleLinkUrl error:', error);
    return res.status(500).json({
      error: 'Internal server error while generating Google link URL.',
    });
  }
};

/**
 * POST /api/auth/google/tokens
 * Authenticated: Store or update Google OAuth tokens obtained after OAuth linking/login.
 */
const saveGoogleTokens = async (req, res) => {
  try {
    const { access_token, refresh_token, expires_in } = req.body;

    if (!access_token) {
      return res.status(400).json({
        error: 'Validation error: access_token is required.',
      });
    }

    const saved = await GoogleCalendarService.saveUserTokens(req.user.id, {
      access_token,
      refresh_token,
      expires_in,
    });

    return res.status(200).json({
      message: 'Google Calendar tokens saved and linked successfully.',
      expires_at: saved.expires_at,
    });
  } catch (error) {
    console.error('saveGoogleTokens error:', error);
    return res.status(500).json({
      error: 'Failed to save Google tokens.',
      details: error.message,
    });
  }
};

/**
 * GET /api/auth/google/status
 * Authenticated: Check whether the current user has linked Google Calendar.
 */
const getGoogleLinkStatus = async (req, res) => {
  try {
    const { isLinked, tokenData } = await GoogleCalendarService.checkUserGoogleLink(req.user.id);

    return res.status(200).json({
      connected: isLinked && Boolean(tokenData?.access_token),
      has_refresh_token: Boolean(tokenData?.refresh_token),
      expires_at: tokenData?.expires_at || null,
    });
  } catch (error) {
    console.error('getGoogleLinkStatus error:', error);
    return res.status(500).json({
      error: 'Internal server error while checking Google link status.',
    });
  }
};

/**
 * GET /api/events/calendar-reminders/me
 * Authenticated: Return the list of event IDs the current user has added to their Google Calendar.
 */
const getMyCalendarEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: records, error } = await supabaseAdmin
      .from('user_calendar_events')
      .select('event_id, calendar_event_id, created_at')
      .eq('user_id', userId);

    if (error) {
      console.error('getMyCalendarEvents error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve calendar reminders.',
        details: error.message,
      });
    }

    const eventIds = (records || []).map((r) => r.event_id);

    return res.status(200).json({
      message: 'Calendar reminders retrieved successfully.',
      event_ids: eventIds,
      count: eventIds.length,
      records: records || [],
    });
  } catch (error) {
    console.error('getMyCalendarEvents error:', error);
    return res.status(500).json({
      error: 'Internal server error while retrieving calendar reminders.',
    });
  }
};

module.exports = {
  createEventReminder,
  getGoogleLinkUrl,
  saveGoogleTokens,
  getGoogleLinkStatus,
  getMyCalendarEvents,
};
