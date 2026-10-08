const express = require('express');
const multer = require('multer');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const {
  createForm,
  getFormById,
  getFormsSummary,
  updateForm,
  deleteForm,
  submitForm,
  getFormSubmissions,
  getMySubmissions,
  updateSubmissionAttendance,
  syncSheetForAdmin,
  getTicketPass,
  downloadTicketQr,
  uploadFormFile,
  scannerCheckIn,
  scannerGetAttendees,
  scannerGetEvents,
  scannerVerifyTicket,
} = require('../controllers/formController');
const {
  validateCreateForm,
  validateSubmitForm,
} = require('../middleware/validator');
const { formSubmissionLimiter } = require('../middleware/rateLimiter');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB max limit
});

const router = express.Router();

// Batch Forms Summary (Public — lightweight metadata + status keyed by event_id)
router.get('/summary', getFormsSummary);

// Mobile Scanner App Fast Event List (In-memory RAM cache for 5 minutes, 0 egress)
router.get('/scanner-events', requireAuth, requireRole('admin'), scannerGetEvents);

// User Submissions
router.get('/submissions/my', requireAuth, getMySubmissions);

// Public Ticket Pass Lookup & Direct QR Download (optionalAuth for PII protection)
router.get('/ticket/:ticketId', optionalAuth, getTicketPass);
router.get('/ticket/:ticketId/qr-download', downloadTicketQr);

// Single Form View (public — anyone can see form structure)
router.get('/:id', getFormById);

// Upload Registration File to Google Drive (Authenticated)
router.post(
  '/:formId/upload',
  requireAuth,
  upload.single('file'),
  uploadFormFile
);

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

// Mobile Scanner App Fast Check-In with duplicate scanning prevention
router.post(
  '/submissions/:submissionId/check-in',
  requireAuth,
  requireRole('admin'),
  scannerCheckIn
);

// Mobile Scanner App Ticket Verification & Event Match Check (Low egress, non-mutating)
router.get(
  '/ticket/:ticketId/verify',
  requireAuth,
  requireRole('admin'),
  scannerVerifyTicket
);


// Mobile Scanner App Lightweight Attendees Delta-Sync (Low egress for multiple admins)
router.get(
  '/:formId/scanner-attendees',
  requireAuth,
  requireRole('admin'),
  scannerGetAttendees
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
