/**
 * Security Configuration Module
 * Centralizes lockout policies, rate limits, and CORS origins.
 */

const securityConfig = {
  // Account Lockout Policies
  adminMaxLoginAttempts: parseInt(process.env.ADMIN_MAX_LOGIN_ATTEMPTS, 10) || 5,
  adminLockoutMinutes: parseInt(process.env.ADMIN_LOCKOUT_MINUTES, 10) || 30,

  studentMaxLoginAttempts: parseInt(process.env.STUDENT_MAX_LOGIN_ATTEMPTS, 10) || 10,
  studentLockoutMinutes: parseInt(process.env.STUDENT_LOCKOUT_MINUTES, 10) || 15,

  // Rate Limiting (in milliseconds & max requests)
  rateLimits: {
    adminLogin: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.ADMIN_LOGIN_RATE_LIMIT, 10) || 5,
    },
    studentLogin: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.STUDENT_LOGIN_RATE_LIMIT, 10) || 10,
    },
    adminSignup: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: parseInt(process.env.ADMIN_SIGNUP_RATE_LIMIT, 10) || 3,
    },
    studentSignup: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: parseInt(process.env.STUDENT_SIGNUP_RATE_LIMIT, 10) || 15,
    },
    generalApi: {
      windowMs: 15 * 60 * 1000,
      max: parseInt(process.env.GENERAL_API_RATE_LIMIT, 10) || 5000,
    },
  },

  // CORS Allowed Origins
  getAllowedOrigins: () => {
    const raw = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:3000';
    return raw
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean);
  },
};

module.exports = securityConfig;
