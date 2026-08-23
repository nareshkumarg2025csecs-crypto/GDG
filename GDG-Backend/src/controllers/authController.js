const { supabase, supabaseAdmin } = require('../config/supabase');
const { validateAdminSignupCode } = require('../config/authConfig');
const securityConfig = require('../config/securityConfig');
const { logActivity } = require('../services/activityLogService');
const GoogleCalendarService = require('../services/googleCalendarService');

/**
 * Helper function for user signup with a fixed role.
 * Role is strictly enforced by the route handler and NEVER accepted from the request body.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {'student' | 'admin'} fixedRole
 */
const handleSignup = async (req, res, fixedRole) => {
  try {
    const { email, password, full_name, details, admin_code } = req.body;

    const normalizedEmail = email ? email.trim().toLowerCase() : '';

    // 1. If signing up as Admin, strictly validate the ADMIN_SIGNUP_CODE first
    if (fixedRole === 'admin') {
      if (!validateAdminSignupCode(admin_code)) {
        await logActivity(req, {
          user_id: null,
          action: 'signup_failed',
          details: { email: normalizedEmail, role: 'admin', reason: 'Invalid or missing admin signup code' },
        });

        // Flag suspicious admin signup attempt if wrong code is provided
        await logActivity(req, {
          user_id: null,
          action: 'suspicious_admin_signup_activity',
          details: {
            email: normalizedEmail,
            reason: 'Attempted admin signup with invalid secret code',
            // NOTE FOR FUTURE: Plug in Slack/Discord/Email alert webhook here
          },
        });

        return res.status(403).json({
          error: 'Forbidden: Invalid or missing admin signup code.',
        });
      }
    }

    // 2. Validate required fields
    if (!normalizedEmail || !password || !full_name) {
      await logActivity(req, {
        user_id: null,
        action: 'signup_failed',
        details: { email: normalizedEmail || null, role: fixedRole, reason: 'Missing required signup fields' },
      });

      return res.status(400).json({
        error: 'Validation error: email, password, and full_name are required.',
      });
    }

    if (password.length < 6) {
      await logActivity(req, {
        user_id: null,
        action: 'signup_failed',
        details: { email: normalizedEmail, role: fixedRole, reason: 'Password length less than 6' },
      });

      return res.status(400).json({
        error: 'Validation error: password must be at least 6 characters.',
      });
    }

    // 3. Create user in Supabase Auth using the public client
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: full_name.trim(),
          role: fixedRole,
        },
      },
    });

    if (authError || !authData || !authData.user) {
      await logActivity(req, {
        user_id: null,
        action: 'signup_failed',
        details: { email: normalizedEmail, role: fixedRole, reason: authError?.message || 'Supabase signup failed' },
      });

      return res.status(400).json({
        error: authError ? authError.message : 'Signup failed.',
      });
    }

    const userId = authData.user.id;

    // 4. Insert profile record in `public.profiles` using the Supabase Admin client (Service Role Key)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: userId,
          email: normalizedEmail,
          full_name: full_name.trim(),
          role: fixedRole,
          details: details && typeof details === 'object' ? details : {},
        },
      ])
      .select()
      .single();

    if (profileError) {
      console.error('Profile insertion error:', profileError);
      // Rollback auth user creation if profile creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (cleanupError) {
        console.error('Failed to rollback auth user creation:', cleanupError);
      }

      await logActivity(req, {
        user_id: userId,
        action: 'signup_failed',
        details: { email: normalizedEmail, role: fixedRole, reason: profileError.message },
      });

      return res.status(500).json({
        error: `Failed to create user profile in database: ${profileError.message}`,
      });
    }

    // Log successful signup
    await logActivity(req, {
      user_id: userId,
      action: 'signup',
      details: { email: normalizedEmail, full_name: full_name.trim(), role: fixedRole },
    });

    return res.status(201).json({
      message: `${fixedRole.charAt(0).toUpperCase() + fixedRole.slice(1)} registered successfully.`,
      access_token: authData.session ? authData.session.access_token : null,
      refresh_token: authData.session ? authData.session.refresh_token : null,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      profile: profileData,
    });
  } catch (error) {
    console.error(`Signup error (${fixedRole}):`, error);
    return res.status(500).json({
      error: 'Internal server error during signup.',
    });
  }
};

/**
 * Helper function for user login with Account Lockout and Role verification.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {'student' | 'admin'} expectedRole
 */
const handleLogin = async (req, res, expectedRole) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      await logActivity(req, {
        user_id: null,
        action: 'login_failed',
        details: { email: email || null, attempted_role: expectedRole, reason: 'Missing email or password' },
      });

      return res.status(400).json({
        error: 'Validation error: email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Fetch user profile upfront to check lockout status
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    const maxAttempts =
      expectedRole === 'admin'
        ? securityConfig.adminMaxLoginAttempts
        : securityConfig.studentMaxLoginAttempts;

    const lockoutMinutes =
      expectedRole === 'admin'
        ? securityConfig.adminLockoutMinutes
        : securityConfig.studentLockoutMinutes;

    // 2. Check if account is currently locked
    if (profile && profile.locked_until) {
      const lockExpiry = new Date(profile.locked_until);
      const now = new Date();

      if (now < lockExpiry) {
        const remainingMinutes = Math.ceil((lockExpiry - now) / (60 * 1000));

        await logActivity(req, {
          user_id: profile.id,
          action: 'locked_login_attempt',
          details: {
            email: normalizedEmail,
            role: profile.role,
            locked_until: profile.locked_until,
            remaining_minutes: remainingMinutes,
          },
        });

        return res.status(423).json({
          error: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
        });
      }
    }

    // 3. Attempt authentication with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    // 4. Handle Failed Authentication
    if (authError || !authData || !authData.user || !authData.session) {
      let currentFailedCount = 1;

      if (profile) {
        currentFailedCount = (profile.failed_login_count || 0) + 1;
        const updates = { failed_login_count: currentFailedCount };

        // Check if account should be locked
        if (currentFailedCount >= maxAttempts) {
          const lockoutDate = new Date(Date.now() + lockoutMinutes * 60 * 1000).toISOString();
          updates.locked_until = lockoutDate;

          // Trigger Security Lockout Alert
          await logActivity(req, {
            user_id: profile.id,
            action: 'account_locked',
            details: {
              email: normalizedEmail,
              role: profile.role,
              failed_attempts: currentFailedCount,
              locked_until: lockoutDate,
              lockout_minutes: lockoutMinutes,
              // NOTE FOR FUTURE: Plug in Slack/Discord/Email alert webhook here
            },
          });
        } else if (expectedRole === 'admin' && currentFailedCount >= maxAttempts - 2) {
          // Trigger Suspicious Admin Activity Alert approaching lockout
          await logActivity(req, {
            user_id: profile.id,
            action: 'suspicious_admin_login_activity',
            details: {
              email: normalizedEmail,
              role: 'admin',
              failed_attempts: currentFailedCount,
              threshold: maxAttempts,
              reason: 'Multiple consecutive failed admin login attempts',
              // NOTE FOR FUTURE: Plug in Slack/Discord/Email alert webhook here
            },
          });
        }

        await supabaseAdmin
          .from('profiles')
          .update(updates)
          .eq('id', profile.id);
      }

      await logActivity(req, {
        user_id: profile ? profile.id : null,
        action: 'login_failed',
        details: {
          email: normalizedEmail,
          attempted_role: expectedRole,
          reason: 'Invalid login credentials',
          failed_count: currentFailedCount,
        },
      });

      return res.status(401).json({
        error: 'Invalid email or password.',
      });
    }

    const userId = authData.user.id;

    // 5. Strict Role Verification
    if (!profile || profile.role !== expectedRole) {
      await logActivity(req, {
        user_id: userId,
        action: 'login_failed',
        details: {
          email: normalizedEmail,
          actual_role: profile?.role || 'unknown',
          attempted_role: expectedRole,
          reason: `Role mismatch: cannot log in via ${expectedRole} route`,
        },
      });

      return res.status(403).json({
        error: `Access denied. Role mismatch: ${profile?.role || 'unknown'} account cannot log in via the ${expectedRole} login route.`,
      });
    }

    // 6. Successful Login: Reset failed attempts counter and clear locked_until
    if (profile.failed_login_count > 0 || profile.locked_until) {
      await supabaseAdmin
        .from('profiles')
        .update({
          failed_login_count: 0,
          locked_until: null,
        })
        .eq('id', userId);
    }

    // Log successful login
    await logActivity(req, {
      user_id: userId,
      action: 'login',
      details: { email: normalizedEmail, role: profile.role },
    });

    return res.status(200).json({
      message: `${expectedRole.charAt(0).toUpperCase() + expectedRole.slice(1)} login successful.`,
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        details: profile.details,
      },
    });
  } catch (error) {
    console.error(`Login error (${expectedRole}):`, error);
    return res.status(500).json({
      error: 'Internal server error during login.',
    });
  }
};

/**
 * POST /api/auth/student/signup
 */
const studentSignup = async (req, res) => {
  return handleSignup(req, res, 'student');
};

/**
 * POST /api/auth/admin/signup
 */
const adminSignup = async (req, res) => {
  return handleSignup(req, res, 'admin');
};

/**
 * POST /api/auth/student/login
 */
const studentLogin = async (req, res) => {
  return handleLogin(req, res, 'student');
};

/**
 * POST /api/auth/admin/login
 */
const adminLogin = async (req, res) => {
  return handleLogin(req, res, 'admin');
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const userId = req.user?.id;

    await logActivity(req, {
      user_id: userId,
      action: 'logout',
      details: { email: req.user?.email, role: req.user?.profile?.role },
    });

    return res.status(200).json({
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      error: 'Internal server error during logout.',
    });
  }
};

/**
 * GET /api/auth/google/url
 */
const getGoogleOAuthUrl = async (req, res) => {
  try {
    const { role, admin_code } = req.query;

    if (role === 'admin') {
      if (!validateAdminSignupCode(admin_code)) {
        await logActivity(req, {
          user_id: null,
          action: 'google_auth_failed',
          details: { reason: 'Invalid or missing admin signup code for Google OAuth' },
        });

        return res.status(403).json({
          error: 'Forbidden: Invalid or missing admin signup code for Google admin authentication.',
        });
      }
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const redirectUrl = `${clientUrl}/auth/callback${role === 'admin' ? '?role=admin' : ''}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      return res.status(400).json({
        error: 'Failed to generate Google OAuth URL.',
      });
    }

    return res.status(200).json({
      message: 'Google OAuth URL generated successfully.',
      url: data?.url,
      provider: 'google',
      role_requested: role || 'student',
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar',
      ],
    });
  } catch (error) {
    console.error('getGoogleOAuthUrl error:', error);
    return res.status(500).json({
      error: 'Internal server error while generating Google OAuth URL.',
    });
  }
};

/**
 * POST /api/auth/google/sync-profile
 */
const syncGoogleProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing Bearer token.' });
    }

    const token = authHeader.split(' ')[1];
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid auth token.' });
    }

    const user = userData.user;
    const { provider_token, provider_refresh_token, role = 'student', admin_code } = req.body;

    if (role === 'admin') {
      if (!validateAdminSignupCode(admin_code)) {
        await logActivity(req, {
          user_id: user.id,
          action: 'google_signup_failed',
          details: { email: user.email, reason: 'Invalid or missing admin signup code for Google admin sync' },
        });

        return res.status(403).json({
          error: 'Forbidden: Invalid or missing admin signup code for Google admin registration.',
        });
      }
    }

    const assignedRole = role === 'admin' ? 'admin' : 'student';

    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    let isNewUser = false;
    if (!profile) {
      isNewUser = true;
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Google User';
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email,
            full_name: fullName,
            role: assignedRole,
            details: {},
          },
        ])
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ error: 'Failed to create profile for Google user.' });
      }
      profile = newProfile;
    }

    if (provider_token) {
      await GoogleCalendarService.saveUserTokens(user.id, {
        access_token: provider_token,
        refresh_token: provider_refresh_token,
        expires_in: 3600,
      });
    }

    await logActivity(req, {
      user_id: user.id,
      action: isNewUser ? 'signup' : 'login',
      details: { email: user.email, provider: 'google', role: profile.role },
    });

    return res.status(200).json({
      message: 'Google profile synced successfully.',
      profile,
      google_tokens_saved: Boolean(provider_token),
    });
  } catch (error) {
    console.error('syncGoogleProfile error:', error);
    return res.status(500).json({
      error: 'Internal server error while syncing Google profile.',
    });
  }
};

module.exports = {
  studentSignup,
  adminSignup,
  studentLogin,
  adminLogin,
  logout,
  getGoogleOAuthUrl,
  syncGoogleProfile,
};
