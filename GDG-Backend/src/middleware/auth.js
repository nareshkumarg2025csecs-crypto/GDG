const crypto = require('crypto');
const { supabaseAdmin, supabase } = require('../config/supabase');
const { BoundedMap } = require('../utils/boundedCache');

// Cache validated tokens + profiles for 5 minutes (300s) to slash Supabase Auth + PostgREST egress
const AUTH_CACHE_TTL = 300 * 1000;
const authCache = new BoundedMap(1000);

const invalidateAuthCache = (userId = null) => {
  if (!userId) {
    authCache.clear();
    return;
  }
  for (const [token, entry] of authCache.entries()) {
    if (entry.user?.id === userId) {
      authCache.delete(token);
    }
  }
};

/**
 * Middleware: requireAuth
 * Extracts and validates the Bearer token from the Authorization header.
 * Verifies the user session via Supabase and fetches the user's profile from the `profiles` table.
 * Attaches the authenticated user and profile to `req.user`.
 * Cached for 60s per token to eliminate repetitive PostgREST & Auth calls.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized: Missing or invalid Authorization header. Expected Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized: Token is missing.',
      });
    }

    const now = Date.now();
    const cached = authCache.get(token);
    if (cached && cached.expiresAt > now) {
      req.user = {
        ...cached.user,
        profile: cached.profile,
      };
      return next();
    }

    // 0. Scanner Token Fast-Path Validation (HMAC SHA-256)
    if (token.startsWith('scanner_v1.')) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const [, b64Payload, signature] = parts;
        const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'gdg-scanner-secret-key-2026';
        const expectedSig = crypto.createHmac('sha256', secret).update(b64Payload).digest('hex');

        if (signature.length === expectedSig.length && crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
          try {
            const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
            if (payload.exp && payload.exp * 1000 > now) {
              const { data: profile, error: profileErr } = await supabaseAdmin
                .from('profiles')
                .select('id, email, full_name, role, details, created_at')
                .eq('id', payload.sub)
                .single();

              if (!profileErr && profile && profile.role === 'admin') {
                const scannerUser = { id: profile.id, email: profile.email, role: 'admin' };
                authCache.set(token, {
                  user: scannerUser,
                  profile,
                  expiresAt: now + AUTH_CACHE_TTL,
                });
                req.user = {
                  ...scannerUser,
                  profile,
                };
                return next();
              }
            }
          } catch (e) {
            // Invalid payload format
          }
        }
      }
      return res.status(401).json({
        error: 'Unauthorized: Invalid or expired scanner admin session token.',
      });
    }

    // Verify token with Supabase Auth
    // Use getUser(token) to securely validate the JWT against Supabase Auth
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !userData || !userData.user) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or expired token.',
        details: authError ? authError.message : undefined,
      });
    }

    const user = userData.user;

    // Fetch user profile (with role) using admin client (service role)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, details, created_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Profile not found for authenticated user.',
        details: profileError ? profileError.message : undefined,
      });
    }

    // Store in cache for 60s
    authCache.set(token, {
      user,
      profile,
      expiresAt: now + AUTH_CACHE_TTL,
    });

    // Attach user information and profile to the request object
    req.user = {
      ...user,
      profile,
      role: profile.role || 'student',
    };

    next();
  } catch (error) {
    console.error('requireAuth Middleware Error:', error);
    return res.status(500).json({
      error: 'Internal server error during authentication.',
    });
  }
};

/**
 * Middleware factory: requireRole
 * Restricts route access to users with specified roles.
 * Must be used AFTER `requireAuth` middleware.
 *
 * @param  {...string} allowedRoles - List of permitted roles (e.g. 'student', 'admin')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.profile) {
      return res.status(401).json({
        error: 'Unauthorized: User authentication required before role check.',
      });
    }

    const userRole = req.user.profile.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your role is '${userRole}'.`,
      });
    }

    next();
  };
};

/**
 * Optional Auth Middleware
 * Attaches req.user if a valid token is provided, but does not reject the request if missing/invalid.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const now = Date.now();
    const cached = authCache.get(token);
    if (cached && cached.expiresAt > now) {
      req.user = {
        ...cached.user,
        profile: cached.profile,
        role: cached.profile?.role || 'student',
      };
      return next();
    }

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userData?.user) return next();

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, details, created_at')
      .eq('id', userData.user.id)
      .single();

    if (profile) {
      authCache.set(token, {
        user: userData.user,
        profile,
        expiresAt: now + AUTH_CACHE_TTL,
      });
    }

    req.user = {
      ...userData.user,
      profile: profile || null,
      role: profile?.role || 'student',
    };
    return next();
  } catch (err) {
    // Fail open for public routes
    return next();
  }
};

module.exports = {
  requireAuth,
  requireRole,
  optionalAuth,
  invalidateAuthCache,
};
