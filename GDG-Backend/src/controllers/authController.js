const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { supabase, supabaseAdmin, createIsolatedAuthClient } = require('../config/supabase');
const { validateAdminSignupCode, getScannerTokenSecret } = require('../config/authConfig');
const securityConfig = require('../config/securityConfig');
const { logActivity } = require('../services/activityLogService');
const GoogleCalendarService = require('../services/googleCalendarService');
const GoogleDriveService = require('../services/googleDriveService');
const GmailApiService = require('../services/gmailApiService');
const EmailQueueService = require('../services/emailQueueService');

/**
 * Escapes unsafe HTML characters to prevent XSS / HTML injection in generated emails.
 *
 * @param {any} str
 * @returns {string}
 */
const escapeHtml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Builds the official Google Developer Groups branded HTML verification email.
 *
 * @param {string} fullName
 * @param {string} actionLink
 * @returns {string}
 */
const buildVerificationEmailHtml = (fullName, actionLink) => {
  const safeFullName = escapeHtml(fullName);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Student Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">
                Google Developer Groups
              </h1>
              <p style="margin: 4px 0 0; font-size: 13px; font-weight: 600; color: #4285F4; text-transform: uppercase; letter-spacing: 1px;">
                Student Community On Campus
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 36px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #1e293b;">
                Welcome, ${safeFullName}! 👋
              </h2>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
                Thank you for creating an account with our GDG student community. To finish setting up your account and access workshops, hackathons, and certifications, please verify your email address.
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${actionLink}" target="_blank" style="display: inline-block; background-color: #4285F4; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 2px 8px rgba(66, 133, 244, 0.35);">
                      Verify Email &amp; Continue to Onboarding →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 16px; font-size: 12px; line-height: 1.5; color: #64748b;">
                Once verified, you will be automatically redirected to your onboarding page to complete your academic profile.
              </p>
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px; margin-top: 20px;">
                <p style="margin: 0 0 6px; font-size: 11px; font-weight: 600; color: #475569;">
                  Button not working? Paste this link into your browser:
                </p>
                <p style="margin: 0; font-size: 11px; color: #4285F4; word-break: break-all;">
                  <a href="${actionLink}" style="color: #4285F4; text-decoration: underline;">${actionLink}</a>
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 36px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                This link will expire in 24 hours. If you did not sign up for a GDG account, you can safely disregard this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Builds the official Google Developer Groups branded HTML password reset email.
 *
 * @param {string} fullName
 * @param {string} actionLink
 * @returns {string}
 */
const buildPasswordResetEmailHtml = (fullName, actionLink) => {
  const safeFullName = escapeHtml(fullName);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your GDG Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">
                Google Developer Groups
              </h1>
              <p style="margin: 4px 0 0; font-size: 13px; font-weight: 600; color: #4285F4; text-transform: uppercase; letter-spacing: 1px;">
                Student Community On Campus
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 36px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #1e293b;">
                Hello, ${safeFullName}! 
              </h2>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
                We received a request to reset your password for your Google Developer Groups student account. Click the button below to set a new password:
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${actionLink}" target="_blank" style="display: inline-block; background-color: #EA4335; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 2px 8px rgba(234, 67, 53, 0.35);">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 16px; font-size: 12px; line-height: 1.5; color: #64748b;">
                This link will safely expire in 1 hour. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.
              </p>
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px; margin-top: 20px;">
                <p style="margin: 0 0 6px; font-size: 11px; font-weight: 600; color: #475569;">
                  Button not working? Paste this link into your browser:
                </p>
                <p style="margin: 0; font-size: 11px; color: #4285F4; word-break: break-all;">
                  <a href="${actionLink}" style="color: #4285F4; text-decoration: underline;">${actionLink}</a>
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 36px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Security notice: Never share this link with anyone. GDG admins will never ask you for your password or reset link.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

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

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:8081';
    const redirectUrl = `${clientUrl}/auth/callback?type=signup`;

    let authDataUser = null;
    let authSession = null;
    let actionLink = null;

    if (fixedRole === 'student' && typeof supabaseAdmin.auth?.admin?.generateLink === 'function') {
      // 3a. Generate signup verification link via Supabase Auth Admin
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: full_name.trim(),
            role: 'student',
          },
          redirectTo: redirectUrl,
        },
      });

      if (linkError || !linkData || !linkData.user) {
        await logActivity(req, {
          user_id: null,
          action: 'signup_failed',
          details: { email: normalizedEmail, role: fixedRole, reason: linkError?.message || 'Supabase generateLink failed' },
        });

        return res.status(400).json({
          error: linkError ? linkError.message : 'Signup failed.',
        });
      }

      authDataUser = linkData.user;
      actionLink = linkData.properties?.action_link;
    } else {
      // 3b. Create user in Supabase Auth using the public client (for admin, or fallback)
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

      authDataUser = authData.user;
      authSession = authData.session;
    }

    const userId = authDataUser.id;

    // 4. Insert or upsert profile record in `public.profiles` using the Supabase Admin client (Service Role Key)
    const profilePayload = [
      {
        id: userId,
        email: normalizedEmail,
        full_name: full_name.trim(),
        role: fixedRole,
        details: details && typeof details === 'object' ? details : {},
      },
    ];

    const profilesTable = supabaseAdmin.from('profiles');
    const upsertOrInsert = typeof profilesTable.upsert === 'function'
      ? profilesTable.upsert(profilePayload, { onConflict: 'id' })
      : profilesTable.insert(profilePayload);

    const { data: profileData, error: profileError } = await upsertOrInsert
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
        error: 'Failed to create user profile in database.',
      });
    }

    // 5. If student signup with verification link, send verification email via Gmail API
    if (fixedRole === 'student' && actionLink) {
      const emailSubject = 'Verify your email - Google Developer Groups (GDG)';
      const emailHtml = buildVerificationEmailHtml(full_name.trim(), actionLink);
      const emailText = `Welcome to Google Developer Groups, ${full_name.trim()}!\n\nPlease click the following link to verify your email and proceed to onboarding:\n${actionLink}\n\nThis link expires in 24 hours.`;

      const sendRes = await GmailApiService.sendMail({
        to: normalizedEmail,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      });

      console.log(`[Student Signup] Verification email sent to ${normalizedEmail} via Gmail API:`, sendRes.success);

      let emailEnqueued = false;
      if (!sendRes.success) {
        console.warn(`[Student Signup] Direct Gmail dispatch failed for ${normalizedEmail} (${sendRes.error || 'unknown'}). Enqueuing through EmailQueueService...`);
        EmailQueueService.enqueue({
          to: normalizedEmail,
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
        });
        emailEnqueued = true;
      }

      await logActivity(req, {
        user_id: userId,
        action: 'signup_verification_sent',
        details: { email: normalizedEmail, full_name: full_name.trim(), email_sent: sendRes.success, enqueued: emailEnqueued },
      });

      return res.status(201).json({
        message: 'Verification link sent to your email. Please check your inbox and verify your account to proceed to onboarding.',
        requires_verification: true,
        email: normalizedEmail,
        access_token: null,
        refresh_token: null,
        user: {
          id: authDataUser.id,
          email: authDataUser.email,
        },
        profile: profileData,
      });
    }

    // Log successful signup (for admin or direct signup fallback)
    await logActivity(req, {
      user_id: userId,
      action: 'signup',
      details: { email: normalizedEmail, full_name: full_name.trim(), role: fixedRole },
    });

    return res.status(201).json({
      message: `${fixedRole.charAt(0).toUpperCase() + fixedRole.slice(1)} registered successfully.`,
      access_token: authSession ? authSession.access_token : null,
      refresh_token: authSession ? authSession.refresh_token : null,
      user: {
        id: authDataUser.id,
        email: authDataUser.email,
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
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, details, locked_until, failed_login_count, created_at')
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
      const errMsg = authError?.message?.toLowerCase() || '';
      if (errMsg.includes('not confirmed') || errMsg.includes('email not confirmed')) {
        await logActivity(req, {
          user_id: profile ? profile.id : null,
          action: 'unconfirmed_login_attempt',
          details: { email: normalizedEmail, role: expectedRole },
        });

        return res.status(403).json({
          error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
          code: 'EMAIL_NOT_VERIFIED',
          email: normalizedEmail,
        });
      }

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
    if (!profile) {
      const { data: profileById } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, role, details, locked_until, failed_login_count, created_at')
        .eq('id', userId)
        .maybeSingle();
      if (profileById) {
        profile = profileById;
      }
    }

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

    // If student has not yet confirmed their email, block login and instruct to verify
    if (expectedRole === 'student' && authData.user && !authData.user.email_confirmed_at) {
      await logActivity(req, {
        user_id: userId,
        action: 'unconfirmed_login_attempt',
        details: { email: normalizedEmail, role: expectedRole },
      });

      return res.status(403).json({
        error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
        code: 'EMAIL_NOT_VERIFIED',
        email: normalizedEmail,
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
        created_at: profile.created_at,
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
 * POST /api/auth/student/resend-verification
 */
const resendStudentVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Validation error: email is required.' });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:8081';
    const redirectUrl = `${clientUrl}/auth/callback?type=signup`;

    if (typeof supabaseAdmin.auth?.admin?.generateLink !== 'function') {
      return res.status(501).json({
        error: 'Email verification generation is not available in current environment.',
      });
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      return res.status(400).json({
        error: linkError?.message || 'Could not generate verification link for this email.',
      });
    }

    const actionLink = linkData.properties.action_link;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('email', normalizedEmail)
      .maybeSingle();

    const fullName = profile?.full_name || 'Student';

    const emailSubject = 'Verify your email - Google Developer Groups (GDG)';
    const emailHtml = buildVerificationEmailHtml(fullName, actionLink);
    const emailText = `Hello ${fullName},\n\nPlease click the link below to verify your email and proceed to onboarding:\n${actionLink}\n\nThis link expires in 24 hours.`;

    const sendRes = await GmailApiService.sendMail({
      to: normalizedEmail,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    });

    console.log(`[Resend Verification] Email sent to ${normalizedEmail} via Gmail API:`, sendRes.success);

    let emailEnqueued = false;
    if (!sendRes.success) {
      console.warn(`[Resend Verification] Direct Gmail dispatch failed for ${normalizedEmail} (${sendRes.error || 'unknown'}). Enqueuing through EmailQueueService...`);
      EmailQueueService.enqueue({
        to: normalizedEmail,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      });
      emailEnqueued = true;
    }

    await logActivity(req, {
      user_id: profile ? profile.id : null,
      action: 'resend_verification_email',
      details: { email: normalizedEmail, email_sent: sendRes.success, enqueued: emailEnqueued },
    });

    return res.status(200).json({
      message: 'A fresh verification link has been sent to your email.',
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('resendStudentVerification error:', error);
    return res.status(500).json({
      error: 'Internal server error while resending verification email.',
    });
  }
};

/**
 * POST /api/auth/student/forgot-password
 * Generates a password recovery link and dispatches a branded reset email via Gmail API.
 */
const studentForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        error: 'Validation error: email is required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if student profile exists in database
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!profile || profile.role !== 'student') {
      // Don't leak user existence for non-students / non-existent emails, but confirm message
      return res.status(200).json({
        success: true,
        message: 'If a student account exists with this email, a password reset link has been sent.',
      });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:8081';
    const redirectUrl = `${clientUrl}/auth/reset-password`;

    // 2. Generate Supabase recovery link via Admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('generateLink recovery error:', linkError);
      return res.status(500).json({
        error: 'Could not generate password reset link. Please try again later.',
      });
    }

    const actionLink = linkData.properties.action_link;
    const fullName = profile.full_name || 'Student';

    // 3. Send branded email via Gmail REST API
    const emailSubject = 'Reset your password - Google Developer Groups (GDG)';
    const emailHtml = buildPasswordResetEmailHtml(fullName, actionLink);
    const emailText = `Hello ${fullName},\n\nPlease click the link below to reset your password:\n${actionLink}\n\nThis link expires in 1 hour. If you did not request this, please ignore this email.`;

    const sendRes = await GmailApiService.sendMail({
      to: normalizedEmail,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    });

    console.log(`[Forgot Password] Reset email sent to ${normalizedEmail} via Gmail API:`, sendRes.success);

    let emailEnqueued = false;
    if (!sendRes.success) {
      console.warn(`[Forgot Password] Direct Gmail dispatch failed for ${normalizedEmail} (${sendRes.error || 'unknown'}). Enqueuing through EmailQueueService...`);
      EmailQueueService.enqueue({
        to: normalizedEmail,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      });
      emailEnqueued = true;
    }

    await logActivity(req, {
      user_id: profile.id,
      action: 'forgot_password_requested',
      details: { email: normalizedEmail, email_sent: sendRes.success, enqueued: emailEnqueued },
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email. Please check your inbox.',
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('studentForgotPassword error:', error);
    return res.status(500).json({
      error: 'Internal server error while processing password reset request.',
    });
  }
};

/**
 * POST /api/auth/reset-password
 * Authenticated via Bearer token (obtained from recovery magic link):
 * Updates the user's password and clears any lockout flags.
 */
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res.status(400).json({
        error: 'Validation error: new password is required.',
      });
    }

    // 1. Update password in Supabase Auth via Admin client
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password }
    );

    if (updateError) {
      console.error('updateUserById reset password error:', updateError);
      return res.status(400).json({
        error: updateError.message || 'Failed to update password.',
      });
    }

    // 2. Clear lockout status and failed attempts in public.profiles
    await supabaseAdmin
      .from('profiles')
      .update({
        failed_login_count: 0,
        locked_until: null,
      })
      .eq('id', userId);

    await logActivity(req, {
      user_id: userId,
      action: 'password_reset_success',
      details: { user_id: userId },
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('resetPassword controller error:', error);
    return res.status(500).json({
      error: 'Internal server error while resetting password.',
    });
  }
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
 * Revokes the server-side Supabase user session, clears the backend auth cache,
 * and logs the logout event.
 */
const logout = async (req, res) => {
  try {
    const userId = req.user?.id;
    const authHeader = req.headers.authorization;
    const token = authHeader && /^bearer\s+/i.test(authHeader)
      ? authHeader.replace(/^bearer\s+/i, '').trim()
      : null;

    // 1. Evict any in-memory cached session for this user and token
    if (userId || token) {
      try {
        const { invalidateAuthCache } = require('../middleware/auth');
        invalidateAuthCache(userId, token);
      } catch (cacheErr) {
        console.warn('Non-fatal: Invalidate auth cache notice:', cacheErr?.message);
      }
    }

    // 2. Invalidate / revoke user session on Supabase
    if (token) {
      try {
        if (typeof supabaseAdmin.auth?.admin?.signOut === 'function') {
          await supabaseAdmin.auth.admin.signOut(token);
        } else if (typeof supabase.auth?.signOut === 'function') {
          await supabase.auth.signOut();
        }
      } catch (revokeErr) {
        console.warn('Non-fatal: Supabase session revocation notice:', revokeErr?.message);
      }
    }

    // 3. Log audit event
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
 * POST /api/auth/refresh
 * Exchanges a valid refresh_token for a new access_token and refresh_token pair.
 * Uses an isolated per-request Supabase client to prevent concurrent user requests
 * from polluting or interfering with shared in-memory session state.
 */
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body || {};
    if (!refresh_token || typeof refresh_token !== 'string' || !refresh_token.trim()) {
      return res.status(400).json({
        error: 'Validation error: refresh_token is required.',
      });
    }

    // Isolated client instance per refresh request prevents cross-request session pollution
    const refreshClient = typeof createIsolatedAuthClient === 'function'
      ? createIsolatedAuthClient()
      : require('@supabase/supabase-js').createClient(
          process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
          process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key',
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
          }
        );

    const { data, error } = await refreshClient.auth.refreshSession({
      refresh_token: refresh_token.trim(),
    });

    if (error || !data?.session) {
      return res.status(401).json({
        error: 'Invalid or expired refresh token. Please sign in again.',
      });
    }

    const { session, user } = data;

    // Fetch user profile to return current role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, details, created_at')
      .eq('id', user.id)
      .maybeSingle();

    return res.status(200).json({
      message: 'Token refreshed successfully.',
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile || null,
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(500).json({
      error: 'Internal server error while refreshing session token.',
    });
  }
};

/**
 * GET /api/auth/google/url
 * Generates the Supabase Google OAuth sign-in URL.
 * Validates requested redirect destinations against an explicit allowlist.
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

    const allowedOrigins = securityConfig.getAllowedOrigins();
    const fallbackClientUrl = process.env.CLIENT_URL || 'http://localhost:8081';

    // Validate origin from headers against allowlist
    let detectedClientUrl = fallbackClientUrl;
    if (req.headers.origin && allowedOrigins.includes(req.headers.origin)) {
      detectedClientUrl = req.headers.origin;
    } else if (req.headers.referer) {
      try {
        const refOrigin = new URL(req.headers.referer).origin;
        if (allowedOrigins.includes(refOrigin)) {
          detectedClientUrl = refOrigin;
        }
      } catch {}
    }

    // Strict validation of client-supplied redirect_to / redirect_url
    const rawRedirect = req.query.redirect_to || req.query.redirect_url;
    let validatedRedirectUrl = `${detectedClientUrl}/auth/callback${role === 'admin' ? '?role=admin' : ''}`;

    if (rawRedirect && typeof rawRedirect === 'string') {
      try {
        if (rawRedirect.startsWith('/')) {
          if (rawRedirect.startsWith('/auth/callback')) {
            validatedRedirectUrl = `${detectedClientUrl}${rawRedirect}`;
          }
        } else {
          const parsed = new URL(rawRedirect);
          if (allowedOrigins.includes(parsed.origin) && parsed.pathname === '/auth/callback') {
            validatedRedirectUrl = parsed.toString();
          } else {
            console.warn('[OAuth Security] Untrusted redirect_to origin rejected:', rawRedirect);
            return res.status(400).json({
              error: 'Bad Request: Untrusted redirect URL origin or invalid callback path.',
            });
          }
        }
      } catch (err) {
        console.warn('[OAuth Security] Malformed redirect_to rejected:', rawRedirect);
        return res.status(400).json({
          error: 'Bad Request: Malformed redirect URL.',
        });
      }
    }

    console.log('[OAuth] Validated OAuth redirectTo:', validatedRedirectUrl);

    // Both Admin and Students use clean standard identity scopes (openid, email, profile).
    const scopesString = 'openid email profile';
    const requestedScopes = ['openid', 'email', 'profile'];

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: scopesString,
        queryParams: {
          prompt: 'select_account',
        },
        redirectTo: validatedRedirectUrl,
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
      scopes: requestedScopes,
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
    let token = null;

    if (authHeader && /^bearer\s+/i.test(authHeader)) {
      token = authHeader.replace(/^bearer\s+/i, '').trim();
    } else if (req.body?.access_token || req.body?.token) {
      token = typeof (req.body.access_token || req.body.token) === 'string'
        ? (req.body.access_token || req.body.token).trim()
        : null;
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Missing Bearer token.' });
    }

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid auth token.' });
    }

    const user = userData.user;
    const { provider_token, provider_refresh_token, role = 'student', admin_code } = req.body;

    // Check if the user already has an existing profile in the database
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, details')
      .eq('id', user.id)
      .maybeSingle();

    const isExistingAdmin = profile && profile.role === 'admin';

    // If requesting admin role and NOT already an established admin in the database,
    // strictly validate the admin_code
    if (role === 'admin' && !isExistingAdmin) {
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

    const assignedRole = role === 'admin' || isExistingAdmin ? 'admin' : 'student';

    let isNewUser = false;
    if (!profile) {
      isNewUser = true;
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Google User';
      const googleProfilePayload = [
        {
          id: user.id,
          email: user.email,
          full_name: fullName,
          role: assignedRole,
          details: {},
        },
      ];

      const googleProfilesTable = supabaseAdmin.from('profiles');
      const upsertOrInsertGoogle = typeof googleProfilesTable.upsert === 'function'
        ? googleProfilesTable.upsert(googleProfilePayload, { onConflict: 'id' })
        : googleProfilesTable.insert(googleProfilePayload);

      const { data: newProfile, error: createError } = await upsertOrInsertGoogle
        .select()
        .single();

      if (createError) {
        return res.status(500).json({
          error: 'Failed to create profile for Google user.',
        });
      }
      profile = newProfile;
    } else if (role === 'admin' && profile.role !== 'admin' && validateAdminSignupCode(admin_code)) {
      // Elevate existing user to admin if they supplied a valid code
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)
        .select()
        .single();
      if (!updateError && updatedProfile) {
        profile = updatedProfile;
      }
    }

    let tokensSaved = false;
    if (provider_token) {
      try {
        await GoogleCalendarService.saveUserTokens(user.id, {
          access_token: provider_token,
          refresh_token: provider_refresh_token,
          expires_in: 3600,
        });
        tokensSaved = true;
      } catch (tokenErr) {
        console.warn('Non-fatal: Failed to save Google provider tokens in syncGoogleProfile:', tokenErr.message);
      }
    }

    try {
      await logActivity(req, {
        user_id: user.id,
        action: isNewUser ? 'signup' : 'login',
        details: { email: user.email, provider: 'google', role: profile.role },
      });
    } catch (logErr) {
      console.warn('Non-fatal: Activity log failed in syncGoogleProfile:', logErr.message);
    }

    return res.status(200).json({
      message: 'Google profile synced successfully.',
      profile,
      google_tokens_saved: tokensSaved,
    });
  } catch (error) {
    console.error('syncGoogleProfile error:', error);
    return res.status(500).json({
      error: 'Internal server error while syncing Google profile.',
    });
  }
};

/**
 * GET /api/auth/google/gmail-auth-url
 * Generates and returns/redirects to Google's consent page requesting https://www.googleapis.com/auth/gmail.send
 */
const getGmailOAuthUrl = async (req, res) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const redirectUri = `${protocol}://${host}/api/auth/google/gmail-callback`;
    const url = GmailApiService.getAuthUrl(redirectUri);

    if (req.query.redirect === 'true') {
      return res.redirect(url);
    }

    return res.status(200).json({
      message: 'Gmail API authorization URL generated.',
      auth_url: url,
      scope: 'https://www.googleapis.com/auth/gmail.send',
      redirect_uri: redirectUri,
    });
  } catch (err) {
    console.error('getGmailOAuthUrl error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/auth/google/gmail-callback
 * Handles Google OAuth callback, exchanges code for refresh token with gmail.send scope, and saves it to .env
 */
const handleGmailOAuthCallback = async (req, res) => {
  try {
    const { code, error, state } = req.query;

    // Route Drive storage authorizations that reused the pre-authorized callback URI
    if (state === 'drive') {
      return handleDriveOAuthCallback(req, res);
    }
    if (error) {
      return res.status(400).send(`
        <div style="font-family: sans-serif; padding: 30px; text-align: center;">
          <h2 style="color: #ef4444;">Authorization Denied or Failed</h2>
          <p>${escapeHtml(error)}</p>
        </div>
      `);
    }
    if (!code) {
      return res.status(400).send(`
        <div style="font-family: sans-serif; padding: 30px; text-align: center;">
          <h2 style="color: #ef4444;">Missing Authorization Code</h2>
          <p>No code returned by Google OAuth.</p>
        </div>
      `);
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const redirectUri = `${protocol}://${host}/api/auth/google/gmail-callback`;

    const tokens = await GmailApiService.exchangeCodeForTokens(code, redirectUri);
    const refreshToken = tokens.refresh_token;

    if (refreshToken) {
      // 1. Save to dedicated DB table (gmail_service_tokens)
      await GmailApiService.saveRefreshToken(refreshToken);
      console.log('[GmailOAuth] Gmail refresh token saved successfully to database');

      // 2. Automatically drain any pending queued registration emails
      EmailQueueService.drainQueue().catch((drainErr) => {
        console.warn('[GmailOAuth] Background queue drain error:', drainErr.message);
      });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:8081';

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Gmail API Connected Successfully</title>
        <meta http-equiv="refresh" content="3;url=${clientUrl}/admin/events?gmail_auth=success" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #1e293b; padding: 40px; border-radius: 24px; text-align: center; max-width: 480px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid #334155; }
          h1 { color: #34d399; font-size: 24px; margin: 0 0 10px 0; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; }
          .badge { display: inline-block; background: rgba(52, 211, 153, 0.15); color: #34d399; padding: 6px 18px; border-radius: 50px; font-weight: bold; font-size: 12px; margin-bottom: 20px; border: 1px solid rgba(52, 211, 153, 0.3); }
          .scope-box { background: #0f172a; padding: 12px 16px; border-radius: 12px; font-family: monospace; font-size: 13px; color: #60a5fa; word-break: break-all; margin: 20px 0; border: 1px solid #1e293b; }
          a { display: inline-block; background: #4285F4; color: #ffffff; padding: 12px 28px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 13px; transition: opacity 0.2s; }
          a:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">✓ Scope Authorized &amp; Saved</div>
          <h1>Gmail API Reconnected!</h1>
          <p>The GDG platform is now actively authorized with Google's Gmail API. Any pending queued emails are now being drained and dispatched automatically.</p>
          <div class="scope-box">https://www.googleapis.com/auth/gmail.send</div>
          <p style="font-size: 12px; color: #64748b;">Redirecting you back to the Admin Events portal in 3 seconds...</p>
          <a href="${clientUrl}/admin/events?gmail_auth=success">Return to Admin Portal Now &rarr;</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('handleGmailOAuthCallback error:', err);
    return res.status(500).send(`
      <div style="font-family: sans-serif; padding: 30px; text-align: center;">
        <h2 style="color: #ef4444;">Exchange Error</h2>
        <p>${escapeHtml(err.message)}</p>
      </div>
    `);
  }
};

/**
 * GET /api/auth/google/gmail-status
 * Authenticated / Admin-only: Verifies real live status of Gmail API token and returns queue statistics.
 */
const getGmailStatus = async (req, res) => {
  try {
    const realStatus = await GmailApiService.checkRealStatus();
    const queueStats = await EmailQueueService.getQueueStats();

    return res.status(200).json({
      message: 'Gmail status and queue information retrieved.',
      ...realStatus,
      queue: queueStats,
    });
  } catch (err) {
    console.error('getGmailStatus error:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};

/**
 * POST /api/auth/google/gmail-drain-queue
 * Admin-only: Manually triggers processing of pending queued emails.
 */
const drainGmailQueue = async (req, res) => {
  try {
    const result = await EmailQueueService.drainQueue();
    return res.status(200).json({
      message: 'Email queue drain completed.',
      result,
    });
  } catch (err) {
    console.error('drainGmailQueue error:', err);
    return res.status(500).json({
      error: 'Failed to drain email queue.',
      details: err.message,
    });
  }
};


/**
 * Validates admin secret signup code prior to Google OAuth redirection or creation.
 * Uses timing-safe verification and logs failed attempts.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const validateAdminCode = async (req, res) => {
  try {
    const { admin_code } = req.body;
    if (!admin_code || typeof admin_code !== 'string' || !admin_code.trim()) {
      return res.status(400).json({
        valid: false,
        error: 'Admin secret code is required.',
      });
    }

    const isValid = validateAdminSignupCode(admin_code.trim());
    if (!isValid) {
      await logActivity(req, {
        user_id: null,
        action: 'admin_code_validation_failed',
        details: { reason: 'Invalid admin code entered' },
      });

      return res.status(400).json({
        valid: false,
        error: 'Invalid admin secret code. Please contact club leads.',
      });
    }

    return res.status(200).json({
      valid: true,
      message: 'Admin secret code verified successfully.',
    });
  } catch (error) {
    console.error('Error validating admin code:', error);
    return res.status(500).json({
      valid: false,
      error: 'Failed to validate admin code.',
    });
  }
};

/**
 * GET /api/auth/google/drive-auth-url
 * Generates and returns or redirects to Google OAuth consent page requesting Google Drive scopes
 */
const getDriveOAuthUrl = async (req, res) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    // Use the pre-authorized gmail-callback with state=drive to avoid redirect_uri_mismatch in Google Console.
    // Also allows dedicated drive-callback if explicitly requested (?dedicated=true).
    const useDedicated = req.query.dedicated === 'true';
    const redirectUri = useDedicated
      ? `${protocol}://${host}/api/auth/google/drive-callback`
      : `${protocol}://${host}/api/auth/google/gmail-callback`;
    const state = useDedicated ? null : 'drive';

    const url = GoogleDriveService.getAuthUrl(redirectUri, state);

    if (req.query.redirect === 'true') {
      return res.redirect(url);
    }

    return res.status(200).json({
      message: 'Drive storage authorization URL generated.',
      auth_url: url,
      redirect_uri: redirectUri,
    });
  } catch (err) {
    console.error('getDriveOAuthUrl error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/auth/google/drive-callback
 * Handles Google OAuth callback, exchanges code for refresh token for Google Drive, and updates config.
 */
const handleDriveOAuthCallback = async (req, res) => {
  try {
    const { code, error, state } = req.query;
    if (error) {
      return res.status(400).send(`
        <div style="font-family: sans-serif; padding: 30px; text-align: center;">
          <h2 style="color: #ef4444;">Authorization Denied or Failed</h2>
          <p>${escapeHtml(error)}</p>
        </div>
      `);
    }
    if (!code) {
      return res.status(400).send(`
        <div style="font-family: sans-serif; padding: 30px; text-align: center;">
          <h2 style="color: #ef4444;">Missing Authorization Code</h2>
          <p>No code returned by Google OAuth.</p>
        </div>
      `);
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    // Match the redirectUri used during the authorization request
    const redirectUri = (state === 'drive' || req.originalUrl.includes('gmail-callback'))
      ? `${protocol}://${host}/api/auth/google/gmail-callback`
      : `${protocol}://${host}/api/auth/google/drive-callback`;

    const tokens = await GoogleDriveService.exchangeCodeForTokens(code, redirectUri);
    const refreshToken = tokens.refresh_token;

    if (refreshToken) {
      // 1. Save to dedicated DB table and cache
      await GoogleDriveService.saveRefreshToken(refreshToken, tokens.email);

      // 2. Also update .env file for local development persistence
      const envPath = path.resolve(__dirname, '../../.env');
      try {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('GDRIVE_REFRESH_TOKEN=')) {
          envContent = envContent.replace(/GDRIVE_REFRESH_TOKEN=.*/g, `GDRIVE_REFRESH_TOKEN=${refreshToken}`);
        } else {
          envContent += `\n# Dedicated Google Drive Storage Refresh Token\nGDRIVE_REFRESH_TOKEN=${refreshToken}\n`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
        process.env.GDRIVE_REFRESH_TOKEN = refreshToken;
        console.log('[DriveOAuth] GDRIVE_REFRESH_TOKEN saved successfully to .env and database');
      } catch (fileErr) {
        console.warn('Could not write GDRIVE_REFRESH_TOKEN to .env file:', fileErr.message);
      }
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:8081';

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Google Drive Storage Connected</title>
        <meta http-equiv="refresh" content="3;url=${clientUrl}/admin/events?drive_auth=success" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #1e293b; padding: 40px; border-radius: 24px; text-align: center; max-width: 480px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid #334155; }
          h1 { color: #34d399; font-size: 24px; margin: 0 0 10px 0; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; }
          .badge { display: inline-block; background: rgba(52, 211, 153, 0.15); color: #34d399; padding: 6px 18px; border-radius: 50px; font-weight: bold; font-size: 12px; margin-bottom: 20px; border: 1px solid rgba(52, 211, 153, 0.3); }
          .scope-box { background: #0f172a; padding: 12px 16px; border-radius: 12px; font-family: monospace; font-size: 13px; color: #60a5fa; word-break: break-all; margin: 20px 0; border: 1px solid #1e293b; }
          a { display: inline-block; background: #4285F4; color: #ffffff; padding: 12px 28px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 13px; transition: opacity 0.2s; }
          a:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">✓ Google Drive Connected</div>
          <h1>Storage Account Linked!</h1>
          <p>The GDG platform is now connected to Google Drive storage${tokens.email ? ` (<b>${escapeHtml(tokens.email)}</b>)` : ''}. All event attendee file uploads will be saved here.</p>
          <div class="scope-box">https://www.googleapis.com/auth/drive</div>
          <p style="font-size: 12px; color: #64748b;">Redirecting back to the Admin Portal in 3 seconds...</p>
          <a href="${clientUrl}/admin/events?drive_auth=success">Return to Admin Portal Now &rarr;</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('handleDriveOAuthCallback error:', err);
    return res.status(500).send(`
      <div style="font-family: sans-serif; padding: 30px; text-align: center;">
        <h2 style="color: #ef4444;">Exchange Error</h2>
        <p>${escapeHtml(err.message)}</p>
      </div>
    `);
  }
};

/**
 * GET /api/auth/google/drive-status
 * Authenticated / Admin-only: Returns real-time Google Drive storage quota and connected email.
 */
const getDriveStatus = async (req, res) => {
  try {
    const status = await GoogleDriveService.checkStorageStatus();
    return res.status(200).json({
      message: 'Drive storage status retrieved.',
      ...status,
    });
  } catch (err) {
    console.error('getDriveStatus error:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};

/**
 * POST /api/auth/google/drive-folder
 * Authenticated / Admin-only: Configures a designated Google Drive public/shared folder for attendee uploads.
 */
const setDriveFolder = async (req, res) => {
  try {
    const { folder_input } = req.body;
    if (!folder_input || typeof folder_input !== 'string' || !folder_input.trim()) {
      return res.status(400).json({ error: 'Please provide a valid Google Drive folder link or folder ID.' });
    }

    const result = await GoogleDriveService.setCustomFolder(folder_input.trim());
    return res.status(200).json({
      message: 'Designated Google Drive folder updated successfully.',
      ...result,
    });
  } catch (err) {
    console.error('setDriveFolder error:', err);
    return res.status(400).json({
      error: err.message || 'Failed to configure Google Drive folder.',
    });
  }
};

/**
 * DELETE /api/auth/google/drive-folder
 * Authenticated / Admin-only: Clears the custom designated Google Drive folder, returning to Drive root.
 */
const clearDriveFolder = async (req, res) => {
  try {
    await GoogleDriveService.clearCustomFolder();
    return res.status(200).json({
      message: 'Designated Google Drive folder cleared. Uploads will now be stored in the account Drive root.',
    });
  } catch (err) {
    console.error('clearDriveFolder error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to clear designated Google Drive folder.',
    });
  }
};

/**
 * POST /api/auth/google/drive-disconnect
 * Authenticated / Admin-only: Disconnects the connected Google Drive storage account and clears tokens.
 */
const disconnectDriveAccount = async (req, res) => {
  try {
    await GoogleDriveService.disconnectStorageAccount();
    return res.status(200).json({
      message: 'Google Drive storage account disconnected successfully.',
    });
  } catch (err) {
    console.error('disconnectDriveAccount error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to disconnect Google Drive storage account.',
    });
  }
};

/**
 * POST /api/auth/scanner/admin-email-login
 * Mobile Scanner App: Sign in using GDG admin email address.
 * Seamlessly authenticates administrators registered directly or via Google OAuth.
 */
const scannerAdminEmailLogin = async (req, res) => {
  try {
    const { email, admin_code, admin_id } = req.body;

    // 1. Strictly validate the admin secret code first
    if (!admin_code || typeof admin_code !== 'string' || !admin_code.trim()) {
      return res.status(400).json({
        error: 'Admin secret verification code is required to access the scanner.',
      });
    }

    if (!validateAdminSignupCode(admin_code.trim())) {
      await logActivity(req, {
        user_id: null,
        action: 'scanner_login_rejected_invalid_secret_code',
        details: { email: email ? String(email).trim().toLowerCase() : null, admin_id: admin_id || null },
      });
      return res.status(401).json({
        error: 'Incorrect admin secret code. Access denied.',
      });
    }

    if ((!email || typeof email !== 'string' || !email.trim()) && !admin_id) {
      return res.status(400).json({ error: 'Admin email or admin ID is required.' });
    }

    const normalizedEmail = email ? email.trim().toLowerCase() : null;

    // 2. Check if an admin profile exists with this email or admin_id
    let profileQuery = supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, details, created_at');

    if (admin_id) {
      profileQuery = profileQuery.eq('id', admin_id);
    } else {
      profileQuery = profileQuery.eq('email', normalizedEmail);
    }

    const { data: profile, error: profileErr } = await profileQuery.maybeSingle();

    if (profileErr) {
      console.error('scannerAdminEmailLogin error querying profile:', profileErr);
      return res.status(500).json({ error: 'Database error validating admin account.' });
    }

    if (!profile) {
      return res.status(404).json({
        error: `No admin account found. Please register on the GDG portal first.`,
      });
    }

    if (profile.role !== 'admin') {
      await logActivity(req, {
        user_id: profile.id,
        action: 'scanner_login_rejected_not_admin',
        details: { email: profile.email, role: profile.role },
      });
      return res.status(403).json({
        error: `Account "${profile.email}" is registered as "${profile.role}", not as an Admin. Only authorized GDG administrators can access the event scanner.`,
      });
    }

    // 3. Generate signed scanner token valid for 30 days
    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = nowSec + 30 * 24 * 60 * 60; // 30 days
    const payloadObj = {
      sub: profile.id,
      email: profile.email,
      role: 'admin',
      iat: nowSec,
      exp: expSec,
    };
    const b64Payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
    const secret = getScannerTokenSecret();
    const signature = crypto.createHmac('sha256', secret).update(b64Payload).digest('hex');
    const scannerToken = `scanner_v1.${b64Payload}.${signature}`;

    await logActivity(req, {
      user_id: profile.id,
      action: 'scanner_admin_login_success',
      details: { email: profile.email, full_name: profile.full_name },
    });

    const position = profile.details?.position || profile.details?.role || 'Administrator';

    return res.status(200).json({
      message: 'Admin authenticated successfully for GDG Scanner.',
      access_token: scannerToken,
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: 'admin',
        position,
      },
      profile,
    });
  } catch (error) {
    console.error('scannerAdminEmailLogin error:', error);
    return res.status(500).json({ error: 'Internal server error during scanner admin login.' });
  }
};

/**
 * GET /api/auth/scanner/verified-admins
 * Returns all active administrators registered in Supabase database.
 * Strictly restricted to authorized callers (authenticated admin or valid X-Admin-Code header).
 */
const getScannerVerifiedAdmins = async (req, res) => {
  try {
    const adminCodeHeader = req.headers['x-admin-code'];
    const isAuthorized = Boolean(
      (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) ||
      (adminCodeHeader && validateAdminSignupCode(String(adminCodeHeader).trim()))
    );

    if (!isAuthorized) {
      return res.status(401).json({
        error: 'Unauthorized: Admin authorization or valid X-Admin-Code header is required to access verified administrators.',
      });
    }

    const { data: admins, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, details, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getScannerVerifiedAdmins error:', error);
      return res.status(500).json({ error: 'Failed to retrieve verified administrators from database.' });
    }

    // Filter out dummy test entries and map cleanly
    const formatted = (admins || [])
      .filter((a) => a.email && !a.email.includes('crud_') && !a.email.includes('student_'))
      .map((admin) => {
        const details = admin.details || {};
        return {
          id: admin.id,
          ...(isAuthorized ? { email: admin.email } : {}),
          name: admin.full_name || (admin.email ? admin.email.split('@')[0] : 'Administrator'),
          position: details.position || details.role || 'Administrator',
          domain: details.domain || details.department || 'Leadership',
          role: admin.role,
        };
      });

    return res.status(200).json({ admins: formatted });
  } catch (error) {
    console.error('getScannerVerifiedAdmins fatal error:', error);
    return res.status(500).json({ error: 'Internal server error retrieving verified admins.' });
  }
};

module.exports = {
  studentSignup,
  resendStudentVerification,
  studentForgotPassword,
  resetPassword,
  adminSignup,
  studentLogin,
  adminLogin,
  logout,
  refreshToken,
  getGoogleOAuthUrl,
  syncGoogleProfile,
  getGmailOAuthUrl,
  handleGmailOAuthCallback,
  getGmailStatus,
  drainGmailQueue,
  validateAdminCode,
  getDriveOAuthUrl,
  handleDriveOAuthCallback,
  getDriveStatus,
  setDriveFolder,
  clearDriveFolder,
  disconnectDriveAccount,
  scannerAdminEmailLogin,
  getScannerVerifiedAdmins,
};

