const express = require('express');
const {
  studentSignup,
  adminSignup,
  studentLogin,
  adminLogin,
  logout,
  getGoogleOAuthUrl,
  syncGoogleProfile,
} = require('../controllers/authController');
const {
  getGoogleLinkUrl,
  saveGoogleTokens,
  getGoogleLinkStatus,
} = require('../controllers/calendarController');
const { requireAuth } = require('../middleware/auth');
const {
  adminLoginLimiter,
  studentLoginLimiter,
  adminSignupLimiter,
  studentSignupLimiter,
} = require('../middleware/rateLimiter');
const {
  validateStudentSignup,
  validateAdminSignup,
  validateLogin,
} = require('../middleware/validator');

const router = express.Router();

// Student Auth Routes (with rate limiters & validation)
router.post(
  '/student/signup',
  studentSignupLimiter,
  validateStudentSignup,
  studentSignup
);

router.post(
  '/student/login',
  studentLoginLimiter,
  validateLogin,
  studentLogin
);

// Admin Auth Routes (with stricter rate limiters & validation)
router.post(
  '/admin/signup',
  adminSignupLimiter,
  validateAdminSignup,
  adminSignup
);

router.post(
  '/admin/login',
  adminLoginLimiter,
  validateLogin,
  adminLogin
);

// Common Logout Route
router.post('/logout', requireAuth, logout);

// Google OAuth Sign-in & Profile Sync
router.get('/google/url', getGoogleOAuthUrl);
router.post('/google/sync-profile', syncGoogleProfile);

// Google Identity Linking & Calendar Management (Authenticated)
router.get('/google/link', requireAuth, getGoogleLinkUrl);
router.post('/google/tokens', requireAuth, saveGoogleTokens);
router.get('/google/status', requireAuth, getGoogleLinkStatus);

module.exports = router;
