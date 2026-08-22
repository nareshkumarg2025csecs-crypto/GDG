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
} = require('../controllers/formController');
const {
  validateCreateForm,
  validateSubmitForm,
} = require('../middleware/validator');

const router = express.Router();

// User Submissions
router.get('/submissions/my', requireAuth, getMySubmissions);

// Single Form View (public — anyone can see form structure)
router.get('/:id', getFormById);

// Submit Form (Students / Authenticated)
router.post(
  '/:formId/submissions',
  requireAuth,
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
