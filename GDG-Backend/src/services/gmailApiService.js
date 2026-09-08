const { supabaseAdmin } = require('../config/supabase');
const MailComposer = require('nodemailer/lib/mail-composer');

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

// In-memory token cache to minimize OAuth exchange roundtrips
let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Service to send emails directly via Google's official Gmail REST API.
 * Uses scope: https://www.googleapis.com/auth/gmail.send
 */
class GmailApiService {
  /**
   * Generates a Google OAuth authorization URL specifically requesting the gmail.send scope.
   *
   * @param {string} redirectUri
   * @returns {string}
   */
  static getAuthUrl(redirectUri) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is missing from environment variables.');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GMAIL_SCOPE,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for access and refresh tokens.
   *
   * @param {string} code
   * @param {string} redirectUri
   * @returns {Promise<{ access_token: string, refresh_token?: string, expires_in: number }>}
   */
  static async exchangeCodeForTokens(code, redirectUri) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing in environment.');
    }

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error_description || data.error || 'Failed to exchange authorization code.');
    }

    return data;
  }

  /**
   * Resolves a valid Google OAuth2 access token for the sending account.
   * Checks:
   * 1. In-memory cached token if still valid
   * 2. GMAIL_REFRESH_TOKEN or GOOGLE_REFRESH_TOKEN in .env
   * 3. user_google_tokens table in Supabase
   *
   * @returns {Promise<string|null>}
   */
  static async getValidAccessToken() {
    const now = Date.now();
    if (cachedAccessToken && tokenExpiresAt > now + 60 * 1000) {
      return cachedAccessToken;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return null;
    }

    // Check refresh token sources
    let refreshToken =
      process.env.GMAIL_REFRESH_TOKEN ||
      process.env.GOOGLE_REFRESH_TOKEN ||
      '';

    // If not in .env, check user_google_tokens table for any stored refresh token
    if (!refreshToken) {
      try {
        const { data: tokenRecord } = await supabaseAdmin
          .from('user_google_tokens')
          .select('refresh_token')
          .not('refresh_token', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (tokenRecord?.refresh_token) {
          refreshToken = tokenRecord.refresh_token;
        }
      } catch (dbErr) {
        // Table might not exist or be empty
      }
    }

    if (!refreshToken) {
      return null;
    }

    // Refresh access token from Google
    try {
      const res = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.warn('[GmailApiService] Token refresh failed:', data.error_description || data.error);
        return null;
      }

      cachedAccessToken = data.access_token;
      tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
      return cachedAccessToken;
    } catch (err) {
      console.error('[GmailApiService] Failed to refresh access token:', err.message);
      return null;
    }
  }

  /**
   * Checks whether Gmail API credentials (Client ID, Client Secret, Refresh Token) are fully configured.
   *
   * @returns {Promise<boolean>}
   */
  static async isConfigured() {
    const token = await this.getValidAccessToken();
    return Boolean(token);
  }

  /**
   * Sends an email via Google's official Gmail API REST endpoint (users.messages.send).
   *
   * @param {Object} options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} options.text - Plain text content
   * @param {string} [options.senderEmail] - Sender email address
   * @param {Array} [options.attachments] - Array of attachments (e.g. inline CID images)
   * @param {Object} [options.headers] - Additional headers
   * @returns {Promise<{ success: boolean, messageId?: string, threadId?: string, error?: string }>}
   */
  static async sendMail({ to, subject, html, text, senderEmail, attachments = [], headers = {} }) {
    try {
      const accessToken = await this.getValidAccessToken();
      if (!accessToken) {
        return {
          success: false,
          error: 'NO_GMAIL_TOKEN',
          message: 'Gmail API is not yet authorized with a refresh token. Scope: ' + GMAIL_SCOPE,
        };
      }

      const fromAddress = senderEmail || process.env.EMAIL_ID || 'me';

      // Compile full RFC 2822 MIME message including headers, HTML, and inline CID images
      const composer = new MailComposer({
        from: `"GDG On Campus" <${fromAddress}>`,
        replyTo: fromAddress,
        to,
        subject,
        text,
        html,
        attachments,
        headers,
      });

      const mimeBuffer = await composer.compile().build();
      // Google Gmail API expects base64url encoding (RFC 4648 §5)
      const raw = Buffer.from(mimeBuffer).toString('base64url');

      const response = await fetch(GMAIL_SEND_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[GmailApiService] Gmail API send error:', data.error);
        return {
          success: false,
          error: data.error?.message || 'Failed to send message via Gmail API.',
          details: data.error,
        };
      }

      console.log(`[GmailApiService] Email successfully dispatched via Gmail API to ${to} (Message ID: ${data.id})`);
      return {
        success: true,
        messageId: data.id,
        threadId: data.threadId,
      };
    } catch (err) {
      console.error('[GmailApiService] sendMail exception:', err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }
}

module.exports = GmailApiService;
