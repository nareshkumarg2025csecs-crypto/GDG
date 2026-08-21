const { supabaseAdmin, supabase } = require('../config/supabase');

/**
 * Middleware: requireAuth
 * Extracts and validates the Bearer token from the Authorization header.
 * Verifies the user session via Supabase and fetches the user's profile from the `profiles` table.
 * Attaches the authenticated user and profile to `req.user`.
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
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Profile not found for authenticated user.',
        details: profileError ? profileError.message : undefined,
      });
    }

    // Attach user information and profile to the request object
    req.user = {
      ...user,
      profile,
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

module.exports = {
  requireAuth,
  requireRole,
};
