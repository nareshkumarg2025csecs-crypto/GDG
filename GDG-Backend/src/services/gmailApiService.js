const { supabaseAdmin } = require('../config/supabase');
const MailComposer = require('nodemailer/lib/mail-composer');

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid';

// In-memory token & sender profile cache to minimize OAuth exchange roundtrips
let cachedAccessToken = null;
let tokenExpiresAt = 0;
let cachedSenderProfile = null;
let senderProfileExpiresAt = 0;

/**
 * Service to send emails directly via Google's official Gmail REST API.
 * Uses scope: https://www.googleapis.com/auth/gmail.send
 */
class GmailApiService {
  /**
   * Generates a Google OAuth authorization URL specifically requesting the gmail.send and userinfo.email scopes.
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
   * Saves a new refresh token to the database and memory.
   */
  static async saveRefreshToken(refreshToken, email = null) {
    if (!refreshToken) return;

    // Reset memory cache
    cachedAccessToken = null;
    tokenExpiresAt = 0;
    cachedSenderProfile = null;
    senderProfileExpiresAt = 0;

    try {
      await supabaseAdmin
        .from('gmail_service_tokens')
        .upsert({
          id: 'default',
          refresh_token: refreshToken,
          email: email || process.env.EMAIL_ID || null,
          updated_at: new Date().toISOString(),
        });
      console.log('[GmailApiService] Refresh token saved to gmail_service_tokens table');
    } catch (dbErr) {
      console.warn('[GmailApiService] Could not save to gmail_service_tokens table:', dbErr.message);
    }
  }

  /**
   * Fetches the authentic sender profile (name, photo/avatar URL, email) directly from Google UserInfo.
   * Caches in memory to minimize external roundtrips during high-volume email dispatch.
   *
   * @param {boolean} [forceRefresh=false]
   * @returns {Promise<{ name: string, photoUrl: string, email: string }>}
   */
  static async getSenderProfile(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedSenderProfile && senderProfileExpiresAt > now) {
      return cachedSenderProfile;
    }

    const defaultEmail = process.env.GOOGLE_SENDER_EMAIL || process.env.EMAIL_ID || 'gdg@rajalakshmi.edu.in';
    const fallbackProfile = {
      name: process.env.EMAIL_FROM_NAME || 'GDG On Campus REC',
      photoUrl: '',
      email: defaultEmail,
    };

    try {
      const accessToken = await this.getValidAccessToken();
      if (!accessToken) {
        return fallbackProfile;
      }

      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        console.warn('[GmailApiService] Could not fetch Google userinfo:', res.status, res.statusText);
        return fallbackProfile;
      }

      const info = await res.json();
      const accountEmail = info.email || defaultEmail;

      // Determine display name from Google or graceful context-aware fallback
      let resolvedName = info.name || [info.given_name, info.family_name].filter(Boolean).join(' ');
      if (!resolvedName || resolvedName.trim() === '' || resolvedName === accountEmail) {
        if (process.env.EMAIL_FROM_NAME) {
          resolvedName = process.env.EMAIL_FROM_NAME;
        } else if (accountEmail.toLowerCase().startsWith('gdg')) {
          resolvedName = 'GDG On Campus REC';
        } else {
          resolvedName = 'GDG On Campus';
        }
      }

      const profile = {
        name: resolvedName.trim(),
        photoUrl: info.picture || info.photo || '',
        email: accountEmail,
      };

      // Cache for 1 hour
      cachedSenderProfile = profile;
      senderProfileExpiresAt = now + 60 * 60 * 1000;

      // Update gmail_service_tokens table with authentic connected email if missing
      try {
        await supabaseAdmin
          .from('gmail_service_tokens')
          .update({ email: accountEmail })
          .eq('id', 'default');
      } catch (_) {}

      return profile;
    } catch (err) {
      console.warn('[GmailApiService] getSenderProfile exception:', err.message);
      return fallbackProfile;
    }
  }

  /**
   * Resolves a valid Google OAuth2 access token for the sending account.
   * Checks:
   * 1. In-memory cached token if still valid
   * 2. gmail_service_tokens table in Supabase
   * 3. GMAIL_REFRESH_TOKEN or GOOGLE_REFRESH_TOKEN in .env
   * 4. user_google_tokens table in Supabase
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
    let refreshToken = '';

    // 1. Check dedicated service tokens table
    try {
      const { data: serviceToken } = await supabaseAdmin
        .from('gmail_service_tokens')
        .select('refresh_token')
        .eq('id', 'default')
        .maybeSingle();

      if (serviceToken?.refresh_token) {
        refreshToken = serviceToken.refresh_token;
      }
    } catch {
      // Table might not exist yet
    }

    // 2. Check process.env
    if (!refreshToken) {
      refreshToken =
        process.env.GMAIL_REFRESH_TOKEN ||
        process.env.GOOGLE_REFRESH_TOKEN ||
        '';
    }

    // 3. Fallback to user_google_tokens table for any stored refresh token
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
   * Performs an actual live verification of the Gmail OAuth token with Google servers.
   * Returns alive, expired, rate_limited, or not_configured.
   *
   * @returns {Promise<{ status: 'alive'|'expired'|'rate_limited'|'not_configured', email?: string, scope?: string, expiresIn?: number, message: string }>}
   */
  static async checkRealStatus() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return {
        status: 'not_configured',
        message: 'Google Client ID or Client Secret is missing from environment.',
      };
    }

    let refreshToken = '';
    let serviceToken = null;
    try {
      const { data } = await supabaseAdmin
        .from('gmail_service_tokens')
        .select('refresh_token, email, updated_at')
        .eq('id', 'default')
        .maybeSingle();

      if (data?.refresh_token) {
        serviceToken = data;
        refreshToken = data.refresh_token;
      }
    } catch {
      // ignore
    }

    if (!refreshToken) {
      refreshToken = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN || '';
    }

    if (!refreshToken) {
      return {
        status: 'not_configured',
        message: 'No Gmail refresh token is configured.',
      };
    }

    // Force fresh validation or use valid access token
    const accessToken = await this.getValidAccessToken();
    if (!accessToken) {
      return {
        status: 'expired',
        message: 'Gmail refresh token has expired or was revoked by Google.',
      };
    }

    // Hit Google tokeninfo API to verify live validity
    try {
      const infoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
      const infoData = await infoRes.json();

      if (!infoRes.ok || infoData.error) {
        return {
          status: 'expired',
          message: infoData.error_description || infoData.error || 'Token validation failed with Google.',
        };
      }

      // Check if gmail.send scope is granted
      const scopeStr = infoData.scope || '';
      const hasGmailSend = scopeStr.includes('gmail.send');
      const expiresInSec = Number(infoData.expires_in) || 3600;
      const accessMins = Math.max(1, Math.floor(expiresInSec / 60));

      // Real expiration timing calculation:
      // 1. Live Google Access Token: expires in `accessMins` minutes (auto-renewed by backend refresh token)
      // 2. Google OAuth Refresh Token: For Google Cloud apps in "Testing" status, Google expires refresh tokens after 7 days
      let daysLeft = null;
      let expirationTiming = `Live Access: auto-refreshes in ${accessMins}m`;

      if (serviceToken?.updated_at) {
        const authDate = new Date(serviceToken.updated_at);
        if (!isNaN(authDate.getTime())) {
          const daysPassed = (Date.now() - authDate.getTime()) / (1000 * 60 * 60 * 24);
          daysLeft = Math.max(0, Math.ceil(7 - daysPassed));
          expirationTiming = `Expires in ~${daysLeft}d (Test Token) • Session renews in ${accessMins}m`;
        }
      }

      // Dynamically fetch authentic sender profile (name and avatar photo)
      const senderProfile = await this.getSenderProfile().catch(() => null);

      return {
        status: 'alive',
        isRealCheck: true,
        email: senderProfile?.email || infoData.email || process.env.EMAIL_ID || process.env.GOOGLE_SENDER_EMAIL || 'Configured Sender',
        senderName: senderProfile?.name || 'GDG On Campus REC',
        senderPhoto: senderProfile?.photoUrl || null,
        expiresIn: expiresInSec,
        sessionMinsLeft: accessMins,
        testModeDaysLeft: daysLeft,
        authorizedAt: serviceToken?.updated_at || null,
        expirationTiming,
        scope: scopeStr,
        hasGmailSend,
        message: hasGmailSend
          ? `Verified live with Google OAuth. Access token valid for ${accessMins}m (auto-refreshes via stored refresh token).`
          : 'Token is valid but missing gmail.send permission.',
      };
    } catch (err) {
      return {
        status: 'expired',
        message: `Failed to contact Google OAuth API: ${err.message}`,
      };
    }
  }

  /**
   * Checks whether Gmail API credentials (Client ID, Client Secret, Refresh Token) are fully configured.
   *
   * @returns {Promise<boolean>}
   */
  static async isConfigured() {
    const status = await this.checkRealStatus();
    return status.status === 'alive';
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

      // Normalize attachments: ensure buffer contents serialized as JSON ({ type: 'Buffer', data: [...] }) are restored as real Buffers
      const normalizedAttachments = (Array.isArray(attachments) ? attachments : []).map((att) => {
        if (!att || typeof att !== 'object') return att;
        let content = att.content;

        if (content) {
          if (Buffer.isBuffer(content)) {
            // Already a proper Buffer instance
          } else if (typeof content === 'object') {
            // Case 1: JSON-serialized Node buffer: { type: 'Buffer', data: [...] }
            if (content.type === 'Buffer' && Array.isArray(content.data)) {
              content = Buffer.from(content.data);
            } else if (Array.isArray(content)) {
              // Case 2: Array of byte integers: [137, 80, ...]
              content = Buffer.from(content);
            } else if (content.data && (Array.isArray(content.data) || typeof content.data === 'string')) {
              // Case 3: { data: '...', encoding: 'base64' }
              content = Buffer.from(content.data, content.encoding || 'utf8');
            } else {
              // Case 4: Plain object with numeric indices: { "0": 137, "1": 80, ... }
              const keys = Object.keys(content);
              if (keys.length > 0 && keys.every((k) => !isNaN(Number(k)))) {
                content = Buffer.from(Object.values(content));
              }
            }
          } else if (typeof content === 'string') {
            // If base64 data URI: data:image/png;base64,...
            if (content.startsWith('data:') && content.includes('base64,')) {
              const base64Data = content.split('base64,')[1];
              content = Buffer.from(base64Data, 'base64');
            }
          }
        }

        return {
          ...att,
          content,
        };
      });

      const safeText = typeof text === 'string' ? text : (html ? String(html).replace(/<[^>]+>/g, '') : '');
      const safeHtml = typeof html === 'string' ? html : `<p>${safeText || 'GDG Notification'}</p>`;
      const safeSubject = typeof subject === 'string' ? subject : 'GDG On Campus Notification';

      // Dynamically resolve authentic sender name & photo from the connected Google account
      const senderProfile = await this.getSenderProfile().catch(() => ({
        name: 'GDG On Campus REC',
        photoUrl: '',
        email: senderEmail || process.env.EMAIL_ID || 'me',
      }));

      const displayName = senderProfile.name || 'GDG On Campus REC';
      const fromAddress = senderProfile.email || senderEmail || process.env.EMAIL_ID || 'me';
      const finalFrom = `"${displayName}" <${fromAddress}>`;

      // Compile full RFC 2822 MIME message including headers, HTML, and inline CID images
      const composer = new MailComposer({
        from: finalFrom,
        replyTo: fromAddress,
        to,
        subject: safeSubject,
        text: safeText,
        html: safeHtml,
        attachments: normalizedAttachments,
        headers: headers && typeof headers === 'object' ? headers : {},
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
