const { supabaseAdmin } = require('../config/supabase');

/**
 * Extracts the true client IP address from the Express request.
 * Handles reverse proxies (X-Forwarded-For, X-Real-IP) and IPv6 loopbacks.
 *
 * @param {import('express').Request} req
 * @returns {string} Client IP address
 */
const getClientIp = (req) => {
  if (!req) return '127.0.0.1';

  let ip =
    (req.headers && req.headers['x-forwarded-for']) ||
    (req.headers && req.headers['x-real-ip']) ||
    req.ip ||
    (req.connection && req.connection.remoteAddress) ||
    (req.socket && req.socket.remoteAddress) ||
    '127.0.0.1';

  // If X-Forwarded-For contains multiple IPs, take the first one (original client)
  if (typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // Strip IPv4-mapped IPv6 prefix (e.g. ::ffff:127.0.0.1 -> 127.0.0.1)
  if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  return ip || '127.0.0.1';
};

/**
 * Checks whether an IP address is a private/local network address or loopback.
 *
 * @param {string} ip
 * @returns {boolean}
 */
const isPrivateIp = (ip) => {
  if (!ip) return true;
  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip === '::' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
    ip.startsWith('fc00:') ||
    ip.startsWith('fe80:')
  ) {
    return true;
  }
  return false;
};

/**
 * Resolves approximate geographical location (city, region, country) from the IP.
 * Checks proxy/CDN headers first, then falls back to a fast, non-blocking IP lookup.
 * Localhost and private IPs resolve gracefully to local metadata.
 *
 * @param {string} ip
 * @param {import('express').Request} [req]
 * @returns {Promise<object>} Location object
 */
const getIpLocation = async (ip, req) => {
  try {
    // 1. Check CDN/Proxy headers if available (Cloudflare, Vercel, etc.)
    if (req && req.headers) {
      const cdnCountry = req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'];
      const cdnCity = req.headers['cf-ipcity'] || req.headers['x-vercel-ip-city'];
      const cdnRegion = req.headers['cf-region'] || req.headers['x-vercel-ip-country-region'];

      if (cdnCountry) {
        return {
          city: cdnCity || null,
          region: cdnRegion || null,
          country: cdnCountry,
          source: 'cdn_headers',
        };
      }
    }

    // 2. Handle private/loopback IPs gracefully
    if (isPrivateIp(ip)) {
      return {
        city: 'Localhost',
        region: 'Local Network',
        country: 'Local',
        is_local: true,
      };
    }

    // 3. Optional quick IP Geolocation lookup for public IPs with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1-second max timeout

    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,timezone`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.status === 'success') {
          return {
            city: data.city || null,
            region: data.regionName || null,
            country: data.country || null,
            lat: data.lat || null,
            lon: data.lon || null,
            timezone: data.timezone || null,
          };
        }
      }
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      // Geolocation service unreachable or aborted, ignore gracefully
    }

    return { city: null, country: null };
  } catch (err) {
    return { city: null, country: null };
  }
};

/**
 * Reusable activity logger helper.
 * Inserts an activity log entry into public.activity_logs using the Supabase Service Role client.
 * Never throws or blocks the main request if logging encounters an issue.
 *
 * @param {import('express').Request} req - Express request object
 * @param {object} logParams
 * @param {string|null} [logParams.user_id] - ID of user performing the action (null if anonymous/failed login)
 * @param {string} logParams.action - Action identifier (e.g. 'login', 'signup', 'event_created')
 * @param {object} [logParams.details] - Action-specific metadata
 * @returns {Promise<object|null>} The inserted log entry, or null on error
 */
const logActivity = async (req, { user_id = null, action, details = {} } = {}) => {
  try {
    if (!action) {
      console.warn('logActivity called without an action parameter.');
      return null;
    }

    const ip = getClientIp(req);
    const userAgent = (req && req.headers && req.headers['user-agent']) || 'Unknown';
    const location = await getIpLocation(ip, req);

    const logEntry = {
      user_id: user_id || (req && req.user && req.user.id) || null,
      action,
      details: details && typeof details === 'object' ? details : {},
      ip_address: ip,
      location,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .insert([logEntry])
      .select()
      .single();

    if (error) {
      console.error('Failed to insert activity log:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    // Non-blocking: catch and log to console, ensuring the main API response is never disrupted
    console.error('Unexpected error in logActivity:', error);
    return null;
  }
};

module.exports = {
  logActivity,
  getClientIp,
  getIpLocation,
};
