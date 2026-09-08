const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  createForm,
  getFormById,
  updateForm,
  deleteForm,
  submitForm,
  getFormSubmissions,
  getMySubmissions,
  updateSubmissionAttendance,
  syncSheetForAdmin,
  getTicketPass,
  downloadTicketQr,
} = require('../controllers/formController');
const {
  validateCreateForm,
  validateSubmitForm,
} = require('../middleware/validator');
const { formSubmissionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// User Submissions
router.get('/submissions/my', requireAuth, getMySubmissions);

// Public Ticket Pass Lookup & Direct QR Download
router.get('/ticket/:ticketId', getTicketPass);
router.get('/ticket/:ticketId/qr-download', downloadTicketQr);

// Single Form View (public — anyone can see form structure)
router.get('/:id', getFormById);

// Submit Form (Students / Authenticated with strict rate limiter)
router.post(
  '/:formId/submissions',
  requireAuth,
  formSubmissionLimiter,
  validateSubmitForm,
  submitForm
);

// Admin-only Attendance Management
router.patch(
  '/submissions/:submissionId/attendance',
  requireAuth,
  requireRole('admin'),
  updateSubmissionAttendance
);
router.put(
  '/submissions/:submissionId/attendance',
  requireAuth,
  requireRole('admin'),
  updateSubmissionAttendance
);

// Admin-only Sheets On-Demand Sync
router.post(
  '/:formId/sync-sheet',
  requireAuth,
  requireRole('admin'),
  syncSheetForAdmin
);

// Admin-only Form CRUD (strictly audited: requireAuth + requireRole('admin'))
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validateCreateForm,
  createForm
);

router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  updateForm
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  deleteForm
);

// Admin-only View Submissions
router.get(
  '/:formId/submissions',
  requireAuth,
  requireRole('admin'),
  getFormSubmissions
);

module.exports = router;
