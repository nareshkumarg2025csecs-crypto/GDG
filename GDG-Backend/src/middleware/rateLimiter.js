const rateLimit = require('express-rate-limit');
const securityConfig = require('../config/securityConfig');
const { getClientIp } = require('../services/activityLogService');

/**
 * Standard 429 JSON response handler without leaking internal details.
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    error: 'Too many requests. Please try again later.',
  });
};

/**
 * Custom key generator for rate limiting by submitted email address.
 */
const emailKeyGenerator = (req) => {
  const email = req.body && req.body.email ? String(req.body.email).trim().toLowerCase() : '';
  const ip = getClientIp(req);
  return email ? `email_${email}` : `ip_fallback_${ip}`;
};

/**
 * IP-based key generator.
 */
const ipKeyGenerator = (req) => {
  return `ip_${getClientIp(req)}`;
};

/**
 * Helper to determine whether rate limiting should be skipped.
 * Skips in test environments unless explicitly testing rate limits via header or env.
 */
const shouldSkip = (req) => {
  if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
    return true;
  }
  return false;
};

// 1. Admin Login Rate Limiters (Dual: IP limiter + Email limiter)
const adminLoginIpLimiter = rateLimit({
  windowMs: securityConfig.rateLimits.adminLogin.windowMs,
  max: securityConfig.rateLimits.adminLogin.max,
  keyGenerator: ipKeyGenerator,
  handler: rateLimitHandler,
  skip: shouldSkip,
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLoginEmailLimiter = rateLimit({
  windowMs: securityConfig.rateLimits.adminLogin.windowMs,
  max: securityConfig.rateLimits.adminLogin.max,
  keyGenerator: emailKeyGenerator,
  handler: rateLimitHandler,
  skip: shouldSkip,
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLoginLimiter = [adminLoginIpLimiter, adminLoginEmailLimiter];

// 2. Student Login Rate Limiters (Dual: IP limiter + Email limiter)
const studentLoginIpLimiter = rateLimit({
  windowMs: securityConfig.rateLimits.studentLogin.windowMs,
  max: securityConfig.rateLimits.studentLogin.max,
  keyGenerator: ipKeyGenerator,
  handler: rateLimitHandler,
  skip: shouldSkip,
  standardHeaders: true,
  legacyHeaders: false,
});

const studentLoginEmailLimiter = rateLimit({
  windowMs: securityConfig.rateLimits.studentLogin.windowMs,
  max: securityConfig.rateLimits.studentLogin.max,
  keyGenerator: emailKeyGenerator,
  handler: rateLimitHandler,
  skip: shouldSkip,
  standardHeaders: true,
  legacyHeaders: false,
});

const studentLoginLimiter = [studentLoginIpLimiter, studentLoginEmailLimiter];

const adminSignupLimiter = rateLimit({
  windowMs: securityConfig.rateLimits.adminSignup.windowMs,
  max: securityConfig.rateLimits.adminSignup.max,
  keyGenerator: ipKeyGenerator,
  handler: rateLimitHandler,
  skip: shouldSkip,
  standardHeaders: true,
  legacyHeaders: false,
});

const adminCodeValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min per IP
  keyGenerator: ipKeyGenerator,
  handler: rateLimitHandler,
  skip: shouldSkip,
  standardHeaders: true,
  legacyHeaders: false,
});

const studentSignupLimiter = rateLimit({
  windowMs: securityConfig.rateLimits.studentSignup.windowMs,
  max: securityConfig.rateLimits.studentSignup.max,
  keyGenerator: ipKeyGenerator,
  handler: rateLimitHandler,
  skip: shouldSkip,
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. General API Limiter
const shouldSkipGeneral = (req) => {
  if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
    return true;
  }
  // Do not rate limit in local development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  return false;
};

const generalApiLimiter = rateLimit({
  windowMs: securityConfig.rateLimits.generalApi.windowMs,
  max: securityConfig.rateLimits.generalApi.max,
  keyGenerator: ipKeyGenerator,
  handler: rateLimitHandler,
  skip: shouldSkipGeneral,
  standardHeaders: true,
  legacyHeaders: false,
});

// 5. Form Submission Limiter (prevents registration flooding, mail spam, and database abuse)
const formSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 submissions per 15 minutes
  keyGenerator: (req) => {
    const userId = req.user?.id;
    const ip = getClientIp(req);
    return userId ? `user_sub_${userId}` : `ip_sub_${ip}`;
  },
  handler: rateLimitHandler,
  skip: shouldSkip,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  adminLoginLimiter,
  studentLoginLimiter,
  adminSignupLimiter,
  adminCodeValidationLimiter,
  studentSignupLimiter,
  generalApiLimiter,
  formSubmissionLimiter,
};
