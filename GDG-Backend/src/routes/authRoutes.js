const express = require('express');
const {
  studentSignup,
  adminSignup,
  studentLogin,
  adminLogin,
  logout,
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
} = require('../controllers/authController');
const {
  getGoogleLinkUrl,
  saveGoogleTokens,
  getGoogleLinkStatus,
} = require('../controllers/calendarController');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  adminLoginLimiter,
  studentLoginLimiter,
  adminSignupLimiter,
  adminCodeValidationLimiter,
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
  '/admin/validate-code',
  adminCodeValidationLimiter,
  validateAdminCode
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

// Official Gmail REST API Authorization & Live Health Monitoring
router.get('/google/gmail-auth-url', getGmailOAuthUrl);
router.get('/google/gmail-callback', handleGmailOAuthCallback);
router.get('/google/gmail-status', requireAuth, requireRole('admin'), getGmailStatus);
router.post('/google/gmail-drain-queue', requireAuth, requireRole('admin'), drainGmailQueue);

// Dedicated Google Drive Storage Authorization & Quota Telemetry
router.get('/google/drive-auth-url', getDriveOAuthUrl);
router.get('/google/drive-callback', handleDriveOAuthCallback);
router.get('/google/drive-status', requireAuth, requireRole('admin'), getDriveStatus);
router.post('/google/drive-folder', requireAuth, requireRole('admin'), setDriveFolder);
router.delete('/google/drive-folder', requireAuth, requireRole('admin'), clearDriveFolder);
router.post('/google/drive-disconnect', requireAuth, requireRole('admin'), disconnectDriveAccount);

module.exports = router;

