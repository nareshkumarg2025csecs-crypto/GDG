const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getMe,
  getAdminMembers,
  getStudentDashboard,
  getAdminActivityLogs,
  getSecurityAlerts,
} = require('../controllers/userController');

const router = express.Router();

/**
 * GET /api/me
 * Open to any authenticated user (students and admins).
 */
router.get('/me', requireAuth, getMe);

/**
 * GET /api/student/dashboard
 * Restricted to authenticated users with role: 'student'.
 */
router.get(
  '/student/dashboard',
  requireAuth,
  requireRole('student'),
  getStudentDashboard
);

/**
 * GET /api/admin/members
 * Restricted to authenticated users with role: 'admin'.
 */
router.get(
  '/admin/members',
  requireAuth,
  requireRole('admin'),
  getAdminMembers
);

/**
 * GET /api/admin/logs
 * Restricted to authenticated users with role: 'admin'.
 * Returns paginated audit/activity logs with IP and geolocation.
 */
router.get(
  '/admin/logs',
  requireAuth,
  requireRole('admin'),
  getAdminActivityLogs
);

/**
 * GET /api/admin/logs/security-alerts
 * Restricted to authenticated users with role: 'admin'.
 * Returns flagged suspicious activities and account lockout alerts.
 */
router.get(
  '/admin/logs/security-alerts',
  requireAuth,
  requireRole('admin'),
  getSecurityAlerts
);

module.exports = router;
