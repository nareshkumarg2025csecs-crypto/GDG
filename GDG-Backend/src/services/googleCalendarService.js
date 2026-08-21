const { supabaseAdmin } = require('../config/supabase');

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

/**
 * Service to manage Google Calendar integrations, token storage, refresh, and event insertion.
 */
class GoogleCalendarService {
  /**
   * Save or update Google tokens for a user in the `user_google_tokens` table.
   *
   * @param {string} userId
   * @param {object} tokenData - { access_token, refresh_token, expires_in }
   */
  static async saveUserTokens(userId, { access_token, refresh_token, expires_in }) {
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString();

    const updatePayload = {
      user_id: userId,
      access_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    };

    if (refresh_token) {
      updatePayload.refresh_token = refresh_token;
    }

    const { data, error } = await supabaseAdmin
      .from('user_google_tokens')
      .upsert(updatePayload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving user Google tokens:', error);
      throw new Error(`Failed to save Google tokens: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if a user has a linked Google identity and/or stored Google access/refresh tokens.
   *
   * @param {string} userId
   * @returns {Promise<{ isLinked: boolean, tokenData: object|null, googleIdentity: object|null }>}
   */
  static async checkUserGoogleLink(userId) {
    // 1. Check user_google_tokens table
    const { data: tokenRecord } = await supabaseAdmin
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // 2. Check Supabase Auth identities
    let googleIdentity = null;
    try {
      const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!error && userData && userData.user && userData.user.identities) {
        googleIdentity = userData.user.identities.find((i) => i.provider === 'google') || null;
      }
    } catch (err) {
      console.warn('Could not inspect Supabase Auth identities for user:', userId, err.message);
    }

    const isLinked = Boolean(tokenRecord?.access_token || googleIdentity);

    return {
      isLinked,
      tokenData: tokenRecord || null,
      googleIdentity,
    };
  }

  /**
   * Get a valid (and if necessary, refreshed) Google Access Token for the given user.
   *
   * @param {string} userId
   * @returns {Promise<string|null>} Valid access token, or null if not linked/available
   */
  static async getValidAccessToken(userId) {
    const { tokenData, googleIdentity } = await this.checkUserGoogleLink(userId);

    if (!tokenData) {
      // If user has a Google identity but no tokens stored in table yet
      return null;
    }

    const now = new Date();
    const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at) : null;

    // If token is still valid (with 2 minutes buffer), return it
    if (expiresAt && expiresAt.getTime() - now.getTime() > 120 * 1000) {
      return tokenData.access_token;
    }

    // Token is expired or expiring soon; attempt refresh if refresh_token is available
    if (tokenData.refresh_token) {
      try {
        const refreshed = await this.refreshAccessToken(tokenData.refresh_token);
        await this.saveUserTokens(userId, {
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token || tokenData.refresh_token,
          expires_in: refreshed.expires_in,
        });
        return refreshed.access_token;
      } catch (refreshErr) {
        console.error('Failed to refresh Google access token:', refreshErr);
        return tokenData.access_token; // Fallback to existing token
      }
    }

    return tokenData.access_token;
  }

  /**
   * Refresh an expired Google OAuth access token using Google's token endpoint.
   *
   * @param {string} refreshToken
   * @returns {Promise<{ access_token: string, expires_in: number, refresh_token?: string }>}
   */
  static async refreshAccessToken(refreshToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing from environment variables.');
    }

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error_description || data.error || 'Failed to refresh Google token');
    }

    return {
      access_token: data.access_token,
      expires_in: data.expires_in || 3600,
      refresh_token: data.refresh_token,
    };
  }

  /**
   * Create an event in the user's primary Google Calendar.
   *
   * @param {string} accessToken
   * @param {object} event - Event record from public.events
   * @returns {Promise<object>} Created Google Calendar event
   */
  static async insertCalendarEvent(accessToken, event) {
    const details = event.details || {};
    
    // Determine start and end times (default to tomorrow 10:00 AM - 11:00 AM if not set in JSONB details)
    const startTime = details.startTime || details.start_time || new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const endTime = details.endTime || details.end_time || new Date(new Date(startTime).getTime() + 3600 * 1000).toISOString();

    const calendarEventPayload = {
      summary: event.title,
      description: details.description || `College Club Event: ${event.title}`,
      location: details.location || details.venue || 'College Campus',
      start: {
        dateTime: new Date(startTime).toISOString(),
        timeZone: details.timeZone || 'UTC',
      },
      end: {
        dateTime: new Date(endTime).toISOString(),
        timeZone: details.timeZone || 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'email', minutes: 1440 }, // 24 hours before
        ],
      },
    };

    const response = await fetch(GOOGLE_CALENDAR_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEventPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(
        responseData.error?.message || responseData.error || 'Failed to create event in Google Calendar.'
      );
    }

    return responseData;
  }
}

module.exports = GoogleCalendarService;
