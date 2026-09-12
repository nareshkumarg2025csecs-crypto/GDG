const fs = require('fs');
const path = require('path');
const GoogleCalendarService = require('./googleCalendarService');
const { supabaseAdmin } = require('../config/supabase');

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email';

// In-memory cache for dedicated Drive storage token
let cachedDriveAccessToken = null;
let driveTokenExpiresAt = 0;
let cachedDriveEmail = null;

// In-memory cache for designated public/shared Drive folder
let cachedFolderId = null;
let cachedFolderName = null;
let cachedFolderUrl = null;
let folderConfigLoaded = false;

/**
 * Service to manage Google Drive integration, event folder organization,
 * dedicated storage account connection, and attendee file uploads via Google Drive API v3.
 */
class GoogleDriveService {
  /**
   * Generates a Google OAuth authorization URL specifically requesting Drive full/file scopes
   * and offline access so admins can connect any Google account for storage.
   *
   * @param {string} redirectUri
   * @returns {string}
   */
  static getAuthUrl(redirectUri, state = null) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is missing from environment variables.');
    }

    const query = {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: DRIVE_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
    };

    if (state) {
      query.state = state;
    }

    const params = new URLSearchParams(query);
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for Drive access and refresh tokens.
   *
   * @param {string} code
   * @param {string} redirectUri
   * @returns {Promise<{ access_token: string, refresh_token?: string, expires_in: number, email?: string }>}
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
      throw new Error(data.error_description || data.error || 'Failed to exchange authorization code for Google Drive.');
    }

    // Attempt to identify connected account's email
    let email = null;
    try {
      if (data.access_token) {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json();
          email = userInfo.email || null;
        }
      }
    } catch (userErr) {
      console.warn('Could not fetch userinfo for Drive token:', userErr.message);
    }

    return {
      ...data,
      email,
    };
  }

  /**
   * Saves a dedicated Drive refresh token into memory, database, and process environment.
   *
   * @param {string} refreshToken
   * @param {string|null} email
   */
  static async saveRefreshToken(refreshToken, email = null) {
    if (!refreshToken) return;

    cachedDriveAccessToken = null;
    driveTokenExpiresAt = 0;
    cachedDriveEmail = email || null;
    process.env.GDRIVE_REFRESH_TOKEN = refreshToken;

    try {
      await supabaseAdmin
        .from('drive_service_tokens')
        .upsert({
          id: 'default',
          refresh_token: refreshToken,
          email: email || null,
          updated_at: new Date().toISOString(),
        });
      console.log('[GoogleDriveService] Refresh token saved to drive_service_tokens table');
    } catch (dbErr) {
      console.warn('[GoogleDriveService] Could not save to drive_service_tokens table:', dbErr.message);
    }
  }

  /**
   * Disconnects / logs out the connected Google Drive storage account.
   * Clears tokens from in-memory cache, environment, and Supabase database.
   *
   * @returns {Promise<{ success: boolean }>}
   */
  static async disconnectStorageAccount() {
    cachedDriveAccessToken = null;
    driveTokenExpiresAt = 0;
    cachedDriveEmail = null;
    delete process.env.GDRIVE_REFRESH_TOKEN;

    // 1. Remove GDRIVE_REFRESH_TOKEN from local .env file so it does not reload on server restart
    try {
      const envPath = path.resolve(__dirname, '../../.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(/\n?#?\s*GDRIVE_REFRESH_TOKEN=.*(\r?\n)?/g, '\n');
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('[GoogleDriveService] Cleared GDRIVE_REFRESH_TOKEN from .env file.');
      }
    } catch (fileErr) {
      console.warn('[GoogleDriveService] Could not clear GDRIVE_REFRESH_TOKEN in .env:', fileErr.message);
    }

    // 2. Clear refresh_token and email in Supabase database
    try {
      await supabaseAdmin
        .from('drive_service_tokens')
        .upsert({
          id: 'default',
          refresh_token: null,
          email: null,
          updated_at: new Date().toISOString(),
        });
      console.log('[GoogleDriveService] Storage account disconnected and tokens cleared in database.');
    } catch (dbErr) {
      console.warn('[GoogleDriveService] Could not clear tokens in database:', dbErr.message);
    }

    return { success: true };
  }

  /**
   * Refreshes access token using a Google OAuth refresh token.
   *
   * @param {string} refreshToken
   * @returns {Promise<{ access_token: string, expires_in: number }>}
   */
  static async refreshAccessToken(refreshToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing in environment.');
    }

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
      throw new Error(data.error_description || data.error || 'Failed to refresh Google Drive access token.');
    }

    return data;
  }

  /**
   * Get an active access token from the dedicated Drive storage account if configured.
   *
   * @returns {Promise<string|null>}
   */
  static async getDedicatedStorageToken() {
    // 1. Check in-memory valid token
    const now = Date.now();
    if (cachedDriveAccessToken && driveTokenExpiresAt > now + 60 * 1000) {
      return cachedDriveAccessToken;
    }

    // 2. Determine refresh token from env or database
    let refreshToken = process.env.GDRIVE_REFRESH_TOKEN;

    if (!refreshToken) {
      try {
        const { data } = await supabaseAdmin
          .from('drive_service_tokens')
          .select('refresh_token, email')
          .eq('id', 'default')
          .maybeSingle();

        if (data && data.refresh_token) {
          refreshToken = data.refresh_token;
          process.env.GDRIVE_REFRESH_TOKEN = refreshToken;
          if (data.email) cachedDriveEmail = data.email;
        }
      } catch (err) {
        // Table might not exist yet; ignore
      }
    }

    if (!refreshToken) {
      return null;
    }

    // 3. Refresh access token
    try {
      const refreshed = await this.refreshAccessToken(refreshToken);
      cachedDriveAccessToken = refreshed.access_token;
      driveTokenExpiresAt = now + (refreshed.expires_in || 3600) * 1000;
      return cachedDriveAccessToken;
    } catch (refreshErr) {
      console.error('[GoogleDriveService] Dedicated token refresh failed:', refreshErr.message);
      return null;
    }
  }

  /**
   * Find a valid Google access token for Drive operations.
   * Priority:
   * 1. Dedicated System Drive Storage Account (GDRIVE_REFRESH_TOKEN / drive_service_tokens) - TOP PRIORITY
   * 2. Event / Form creator's linked Google token (if admin with Drive scope)
   * 3. Any admin's linked Google token (if admin provided Drive scopes)
   *
   * Note: Students (attendees) are NEVER queried or required to have Google Drive tokens.
   *
   * @param {string|null} createdByUserId
   * @returns {Promise<string|null>}
   */
  static async getDriveAccessToken(createdByUserId = null) {
    // 1. Dedicated Drive Storage Account (highest priority, avoids personal quota limits)
    const dedicatedToken = await this.getDedicatedStorageToken();
    if (dedicatedToken) {
      return dedicatedToken;
    }

    // 2. Try form creator if they are an admin
    if (createdByUserId) {
      const token = await GoogleCalendarService.getValidAccessToken(createdByUserId);
      if (token) return token;
    }

    // 3. Fallback: Search any admin who linked Google with Drive scope
    try {
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          const token = await GoogleCalendarService.getValidAccessToken(admin.id);
          if (token) return token;
        }
      }
    } catch (err) {
      console.warn('Could not inspect admin tokens for Google Drive:', err.message);
    }

    return null;
  }

  /**
   * Parses a Google Drive folder URL or raw folder ID.
   * Handles:
   *  - https://drive.google.com/drive/folders/1aBcDeFg...
   *  - https://drive.google.com/drive/u/0/folders/1aBcDeFg...
   *  - https://drive.google.com/open?id=1aBcDeFg...
   *  - Direct alphanumeric folder IDs (15 to 100 characters)
   *
   * @param {string} input
   * @returns {string|null}
   */
  static extractFolderId(input) {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();
    // 1. Match /folders/<ID>
    const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch && folderMatch[1]) return folderMatch[1];

    // 2. Match ?id=<ID> or &id=<ID>
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

    // 3. Match raw folder ID string
    if (/^[a-zA-Z0-9_-]{15,100}$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  }

  /**
   * Retrieves the designated public/shared Google Drive parent folder configuration.
   * TOP PRIORITY is always given to the folder link/ID provided and connected by the admin.
   *
   * @param {boolean} forceRefresh - If true, re-queries Supabase for the latest setting
   * @returns {Promise<{ folderId: string|null, folderName: string|null, folderUrl: string|null }>}
   */
  static async getConfiguredRootFolder(forceRefresh = false) {
    if (folderConfigLoaded && !forceRefresh && cachedFolderId) {
      return {
        folderId: cachedFolderId,
        folderName: cachedFolderName,
        folderUrl: cachedFolderUrl,
      };
    }

    // 1. TOP PRIORITY: Database designated folder link/ID configured by admin
    try {
      const { data, error } = await supabaseAdmin
        .from('drive_service_tokens')
        .select('folder_id, folder_name, folder_url')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data && data.folder_id) {
        cachedFolderId = data.folder_id;
        cachedFolderName = data.folder_name || 'Designated Drive Folder';
        cachedFolderUrl = data.folder_url || `https://drive.google.com/drive/folders/${data.folder_id}`;
        folderConfigLoaded = true;
        return {
          folderId: cachedFolderId,
          folderName: cachedFolderName,
          folderUrl: cachedFolderUrl,
        };
      }
    } catch (dbErr) {
      console.warn('[GoogleDriveService] Could not retrieve folder config from DB:', dbErr.message);
    }

    // 2. Secondary Fallback: Environment variable
    if (process.env.GDRIVE_ROOT_FOLDER_ID) {
      cachedFolderId = process.env.GDRIVE_ROOT_FOLDER_ID;
      cachedFolderUrl = `https://drive.google.com/drive/folders/${cachedFolderId}`;
      cachedFolderName = 'Designated Drive Folder';
      folderConfigLoaded = true;
      return {
        folderId: cachedFolderId,
        folderName: cachedFolderName,
        folderUrl: cachedFolderUrl,
      };
    }

    folderConfigLoaded = true;
    return {
      folderId: null,
      folderName: null,
      folderUrl: null,
    };
  }

  /**
   * Configures and validates a designated public/shared Google Drive parent folder.
   *
   * @param {string} input - Folder URL or Folder ID
   * @returns {Promise<{ folderId: string, folderName: string, folderUrl: string }>}
   */
  static async setCustomFolder(input) {
    const folderId = this.extractFolderId(input);
    if (!folderId) {
      throw new Error('Invalid Google Drive folder link or folder ID. Please ensure the link is in the form https://drive.google.com/drive/folders/<id>');
    }

    let folderName = 'Designated GDG Folder';
    let folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

    // Verify folder metadata and accessibility with active Drive token if available
    try {
      const accessToken = await this.getDriveAccessToken(null, null);
      if (accessToken) {
        const verifyRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,webViewLink&supportsAllDrives=true`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }
        );

        if (verifyRes.ok) {
          const fileData = await verifyRes.json();
          if (fileData.mimeType && fileData.mimeType !== 'application/vnd.google-apps.folder') {
            throw new Error(`The provided link points to a "${fileData.mimeType}", not a Google Drive folder.`);
          }
          if (fileData.name) {
            folderName = fileData.name;
          }
          if (fileData.webViewLink) {
            folderUrl = fileData.webViewLink;
          }
        } else if (verifyRes.status === 404) {
          throw new Error('Google Drive folder not found (404). Please ensure the folder exists and is shared with the connected Drive storage account.');
        } else if (verifyRes.status === 403) {
          console.warn('[GoogleDriveService] Drive API 403 during verification - proceeding with caution.');
        }
      }
    } catch (apiErr) {
      if (apiErr.message.includes('not a Google Drive folder') || apiErr.message.includes('not found')) {
        throw apiErr;
      }
      console.warn('[GoogleDriveService] Folder verification warning:', apiErr.message);
    }

    // Cache in memory and process.env
    cachedFolderId = folderId;
    cachedFolderName = folderName;
    cachedFolderUrl = folderUrl;
    folderConfigLoaded = true;
    process.env.GDRIVE_ROOT_FOLDER_ID = folderId;

    // Persist to database
    try {
      await supabaseAdmin
        .from('drive_service_tokens')
        .upsert({
          id: 'default',
          folder_id: folderId,
          folder_name: folderName,
          folder_url: folderUrl,
          updated_at: new Date().toISOString(),
        });
      console.log(`[GoogleDriveService] Designated Drive folder persisted: ${folderName} (${folderId})`);
    } catch (dbErr) {
      console.warn('[GoogleDriveService] Could not persist folder to database:', dbErr.message);
    }

    return {
      folderId,
      folderName,
      folderUrl,
    };
  }

  /**
   * Clears the designated Google Drive folder so files are saved directly in Drive root.
   *
   * @returns {Promise<{ success: boolean }>}
   */
  static async clearCustomFolder() {
    cachedFolderId = null;
    cachedFolderName = null;
    cachedFolderUrl = null;
    folderConfigLoaded = true;
    delete process.env.GDRIVE_ROOT_FOLDER_ID;

    try {
      await supabaseAdmin
        .from('drive_service_tokens')
        .update({
          folder_id: null,
          folder_name: null,
          folder_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'default');
      console.log('[GoogleDriveService] Designated Drive folder cleared.');
    } catch (dbErr) {
      console.warn('[GoogleDriveService] Could not clear folder in database:', dbErr.message);
    }

    return { success: true };
  }

  /**
   * Inspects the current storage account quota, user profile, and designated folder from Google Drive API v3.
   *
   * @returns {Promise<object>}
   */
  static async checkStorageStatus() {
    // Strictly inspect the dedicated storage account so we never falsely report personal admin logins
    const accessToken = await this.getDedicatedStorageToken();
    const folderConfig = await this.getConfiguredRootFolder();

    if (!accessToken) {
      return {
        status: 'not_configured',
        message: 'No dedicated Google Drive storage account is connected.',
        isConfigured: false,
        isDedicatedAccount: false,
        email: null,
        storageLimitBytes: 0,
        storageUsedBytes: 0,
        usagePercentage: 0,
        folderId: folderConfig.folderId,
        folderName: folderConfig.folderName,
        folderUrl: folderConfig.folderUrl,
      };
    }

    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota,user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          status: 'error',
          message: `Drive API returned ${res.status}: ${errText}`,
          isConfigured: true,
          email: cachedDriveEmail || null,
          folderId: folderConfig.folderId,
          folderName: folderConfig.folderName,
          folderUrl: folderConfig.folderUrl,
        };
      }

      const data = await res.json();
      const quota = data.storageQuota || {};
      const user = data.user || {};

      const limit = Number(quota.limit || 0);
      const usage = Number(quota.usage || 0);
      const usageInDrive = Number(quota.usageInDrive || 0);
      const usageInTrash = Number(quota.usageInDriveTrash || 0);

      const email = user.emailAddress || cachedDriveEmail || null;
      if (email && !cachedDriveEmail) {
        cachedDriveEmail = email;
      }

      // Detect if this is an institutional/university domain with pooled storage (e.g. > 1 TB)
      const isInstitutional = limit > 1024 * 1024 * 1024 * 1024 || (email && !email.endsWith('@gmail.com') && !email.endsWith('@googlemail.com'));

      let displayUsageBytes = usage;
      let displayLimitBytes = limit;
      let usagePercentage = 0;

      if (isInstitutional && limit > 1024 * 1024 * 1024 * 1024) {
        // For institutional pooled accounts, quota.limit & quota.usage represent the ENTIRE college/organization pool (hundreds of Terabytes).
        // The user's REAL Drive files are captured by usageInDrive.
        displayUsageBytes = usageInDrive;
        displayLimitBytes = null; // No fixed personal limit returned by Google API for pooled education users
        usagePercentage = 0;
      } else {
        usagePercentage = limit > 0 ? Math.min(100, Math.round((usage / limit) * 1000) / 10) : 0;
      }

      const isQuotaExceeded = limit > 0 && usage >= limit;
      const isNearLimit = limit > 0 && usagePercentage >= 90;

      let status = 'healthy';
      if (isQuotaExceeded) {
        status = 'quota_exceeded';
      } else if (isNearLimit) {
        status = 'warning';
      }

      return {
        status,
        isConfigured: true,
        isDedicatedAccount: Boolean(process.env.GDRIVE_REFRESH_TOKEN),
        isInstitutional: Boolean(isInstitutional),
        email,
        displayName: user.displayName || null,
        storageLimitBytes: displayLimitBytes,
        storageUsedBytes: displayUsageBytes,
        usageInDriveBytes: usageInDrive,
        usageInTrashBytes: usageInTrash,
        domainPooledLimitBytes: limit > 1024 * 1024 * 1024 * 1024 ? limit : null,
        domainPooledUsedBytes: limit > 1024 * 1024 * 1024 * 1024 ? usage : null,
        usagePercentage,
        folderId: folderConfig.folderId,
        folderName: folderConfig.folderName,
        folderUrl: folderConfig.folderUrl,
        message: isQuotaExceeded
          ? "Storage quota has been exceeded! Please switch to a dedicated storage account."
          : isNearLimit
          ? "Storage quota is nearly full (>90%). Consider switching accounts soon."
          : "Google Drive storage account is connected.",
      };
    } catch (err) {
      return {
        status: 'error',
        message: err.message,
        isConfigured: true,
        email: cachedDriveEmail || null,
        folderId: folderConfig.folderId,
        folderName: folderConfig.folderName,
        folderUrl: folderConfig.folderUrl,
      };
    }
  }

  /**
   * Find or create a dedicated Google Drive folder for a specific event.
   * If a designated shared/public parent folder is configured, the event folder is created inside it.
   *
   * @param {string} accessToken
   * @param {string} eventTitle
   * @param {string} eventId
   * @returns {Promise<{ folderId: string, folderName: string }>}
   */
  static async getOrCreateEventFolder(accessToken, eventTitle, eventId) {
    const cleanTitle = (eventTitle || 'Event').trim().replace(/[/\\?%*:|"<>]/g, '-');
    const folderName = `GDG - ${cleanTitle}`;
    const { folderId: parentFolderId } = await this.getConfiguredRootFolder();

    // 1. Search for existing folder with this name in Drive (optionally scoped to parentFolderId)
    try {
      const escapedName = folderName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      let q = `mimeType='application/vnd.google-apps.folder' and name='${escapedName}' and trashed=false`;
      if (parentFolderId) {
        q += ` and '${parentFolderId}' in parents`;
      }
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive&supportsAllDrives=true&includeItemsFromAllDrives=true`;

      const searchRes = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          return {
            folderId: searchData.files[0].id,
            folderName: searchData.files[0].name,
          };
        }
      } else {
        const errText = await searchRes.text();
        console.warn('Drive folder search failed, attempting create:', searchRes.status, errText);
      }
    } catch (searchErr) {
      console.warn('Drive folder search error:', searchErr.message);
    }

    // 2. Folder does not exist, create it (inside parentFolderId if configured)
    const bodyPayload = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: `Dedicated uploads folder for GDG event: ${cleanTitle} (ID: ${eventId})`,
    };
    if (parentFolderId) {
      bodyPayload.parents = [parentFolderId];
    }

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name&supportsAllDrives=true', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      // If creating inside designated parent folder failed (e.g. parent permissions or shared drive issues),
      // retry in Drive root so student registration never breaks!
      if (parentFolderId) {
        console.warn(`[GoogleDriveService] Failed to create inside designated folder ${parentFolderId} (${createRes.status}: ${errText}). Retrying in Drive root...`);
        const fallbackRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name&supportsAllDrives=true', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            description: `Dedicated uploads folder for GDG event: ${cleanTitle} (ID: ${eventId})`,
          }),
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          return {
            folderId: fallbackData.id,
            folderName: fallbackData.name,
          };
        }
      }
      throw new Error(`Failed to create Google Drive folder for event: ${createRes.status} ${errText}`);
    }

    const folderData = await createRes.json();
    return {
      folderId: folderData.id,
      folderName: folderData.name,
    };
  }

  /**
   * Upload an attendee's file into the event's Google Drive folder using multipart upload.
   *
   * @param {object} params
   * @param {string} params.accessToken
   * @param {string} params.folderId
   * @param {string} params.fileName
   * @param {string} params.mimeType
   * @param {Buffer} params.buffer
   * @param {string|null} params.attendeeName
   * @returns {Promise<{ id: string, name: string, webViewLink: string, webContentLink?: string, size: number, mimeType: string }>}
   */
  static async uploadFileToEventFolder({ accessToken, folderId, fileName, mimeType, buffer, attendeeName }) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Valid file buffer is required for Google Drive upload.');
    }

    // Clean attendee and original file name
    const safeAttendee = (attendeeName || 'Attendee')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const safeOrigName = (fileName || 'attachment')
      .trim()
      .replace(/[/\\?%*:|"<>]/g, '_');
    const uploadName = `${safeAttendee}_${Date.now()}_${safeOrigName}`;
    const contentType = mimeType || 'application/octet-stream';

    // Google Drive REST API Multipart Upload
    const boundary = `----GDGFormUploadBoundary${Date.now().toString(16)}`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: uploadName,
      parents: [folderId],
      mimeType: contentType,
      description: `Uploaded for GDG event registration by ${attendeeName || 'attendee'}`,
    };

    const multipartBody = Buffer.concat([
      Buffer.from(
        delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${contentType}\r\n\r\n`
      ),
      buffer,
      Buffer.from(closeDelimiter),
    ]);

    const uploadUrl =
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size,mimeType';

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(multipartBody.length),
        Accept: 'application/json',
      },
      body: multipartBody,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Google Drive file upload failed: ${uploadRes.status} ${errText}`);
    }

    const fileData = await uploadRes.json();

    // Optionally set permission to reader for anyone with link so admins can view easily
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });
    } catch (permErr) {
      console.warn('Could not set public view permission on Drive file:', permErr.message);
    }

    const directViewLink = fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view?usp=drivesdk`;

    return {
      id: fileData.id,
      name: uploadName,
      original_name: fileName,
      webViewLink: directViewLink,
      webContentLink: fileData.webContentLink || null,
      size: Number(fileData.size || buffer.length),
      mimeType: contentType,
    };
  }
}

module.exports = GoogleDriveService;
