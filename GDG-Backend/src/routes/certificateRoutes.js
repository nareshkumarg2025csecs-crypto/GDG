const express = require('express');
const multer = require('multer');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getDefaultTemplate,
  getEventCertificateConfig,
  saveEventCertificateConfig,
  previewCertificate,
  listAssets,
  uploadAsset,
  getAttendedParticipants,
  dispatchCertificates,
  cancelJob,
  getJobProgress,
  getMyCertificates,
  downloadCertificateForSubmission,
} = require('../controllers/certificateController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for logos/backgrounds
});

const router = express.Router();

// Student & Admin Certificate Retrieval & Download
router.get('/my-certificates', requireAuth, getMyCertificates);
router.get('/download/submission/:submissionId', requireAuth, downloadCertificateForSubmission);

// Admin Certificate Studio Endpoints
router.get('/default-template', requireAuth, requireRole('admin'), getDefaultTemplate);
router.get('/event/:eventId', requireAuth, requireRole('admin'), getEventCertificateConfig);
router.put('/event/:eventId', requireAuth, requireRole('admin'), saveEventCertificateConfig);
router.post('/preview', requireAuth, requireRole('admin'), previewCertificate);
router.get('/assets', requireAuth, requireRole('admin'), listAssets);
router.post('/assets', requireAuth, requireRole('admin'), upload.single('file'), uploadAsset);
router.get('/event/:eventId/attended', requireAuth, requireRole('admin'), getAttendedParticipants);
router.post('/dispatch', requireAuth, requireRole('admin'), dispatchCertificates);
router.post('/jobs/:jobId/cancel', requireAuth, requireRole('admin'), cancelJob);
router.get('/jobs/:jobId', requireAuth, requireRole('admin'), getJobProgress);

module.exports = router;
