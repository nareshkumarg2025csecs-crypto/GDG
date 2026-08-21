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

// 3. Signup Limiters (IP based)
const adminSignupLimiter = rateLimit({
  windowMs: securityConfig.rateLimits.adminSignup.windowMs,
  max: securityConfig.rateLimits.adminSignup.max,
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
const generalApiLimiter = rateLimit({
  windowMs: securityConfig.rateLimits.generalApi.windowMs,
  max: securityConfig.rateLimits.generalApi.max,
  keyGenerator: ipKeyGenerator,
  handler: rateLimitHandler,
  skip: shouldSkip,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  adminLoginLimiter,
  studentLoginLimiter,
  adminSignupLimiter,
  studentSignupLimiter,
  generalApiLimiter,
};
