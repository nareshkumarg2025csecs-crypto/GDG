const CertificateService = require('../services/certificateService');
const { supabaseAdmin } = require('../config/supabase');
const { BoundedMap } = require('../utils/boundedCache');

// High-concurrency in-memory cache for generated certificate downloads (capped to 100 for Render 512MB RAM)
const CERT_DOWNLOAD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const certificateDownloadCache = new BoundedMap(100);
const certificateInflightDownloads = new BoundedMap(50);

/**
 * GET /api/certificates/default-template
 * Admin: Get the pristine default Python certificate template
 */
const getDefaultTemplate = async (req, res) => {
  try {
    const { eventTitle } = req.query;
    return res.status(200).json({
      defaultScriptCode: CertificateService.DEFAULT_PYTHON_TEMPLATE,
      defaultEmailSubject: CertificateService.getDefaultEmailSubject(eventTitle || 'GDG Event'),
      defaultEmailBody: CertificateService.getDefaultEmailBody(eventTitle || 'GDG Event'),
    });
  } catch (err) {
    console.error('getDefaultTemplate error:', err);
    return res.status(500).json({ error: 'Failed to retrieve default template.' });
  }
};

/**
 * GET /api/certificates/event/:eventId
 * Admin: Get certificate configuration and dynamic form fields for an event
 */
const getEventCertificateConfig = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required.' });
    }

    const config = await CertificateService.getEventConfig(eventId);
    return res.status(200).json(config);
  } catch (err) {
    console.error('getEventCertificateConfig error:', err);
    return res.status(500).json({ error: err.message || 'Failed to retrieve certificate configuration.' });
  }
};

/**
 * PUT /api/certificates/event/:eventId
 * Admin: Save certificate configuration (Python code, format, email body)
 */
const saveEventCertificateConfig = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { scriptCode, outputFormat, emailSubject, emailBody } = req.body;

    if (!scriptCode || typeof scriptCode !== 'string' || !scriptCode.trim()) {
      return res.status(400).json({ error: 'Python script code cannot be empty.' });
    }

    const result = await CertificateService.saveEventConfig(eventId, {
      scriptCode,
      outputFormat: outputFormat || 'pdf',
      emailSubject: emailSubject || 'Your GDG Certificate of Participation',
      emailBody: emailBody || 'Please find your certificate attached.',
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('saveEventCertificateConfig error:', err);
    return res.status(500).json({ error: err.message || 'Failed to save certificate configuration.' });
  }
};

/**
 * POST /api/certificates/preview
 * Admin: Runs python script with sample attendee data and returns base64 image preview
 */
const previewCertificate = async (req, res) => {
  try {
    const { eventId, scriptCode } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required.' });
    }

    const preview = await CertificateService.generatePreview(eventId, scriptCode);
    return res.status(200).json(preview);
  } catch (err) {
    console.error('previewCertificate error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate preview certificate.' });
  }
};

/**
 * GET /api/certificates/assets
 * Admin: List graphic resources available for certificate designs
 */
const listAssets = async (req, res) => {
  try {
    const assets = CertificateService.listAssets();
    return res.status(200).json({ assets });
  } catch (err) {
    console.error('listAssets error:', err);
    return res.status(500).json({ error: 'Failed to list assets.' });
  }
};

/**
 * POST /api/certificates/assets
 * Admin: Upload new logo or background asset
 */
const uploadAsset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select an image file to upload.' });
    }

    const asset = await CertificateService.saveAsset(req.file);
    return res.status(200).json({
      message: `Asset "${asset.filename}" uploaded successfully.`,
      asset,
    });
  } catch (err) {
    console.error('uploadAsset error:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload asset.' });
  }
};

/**
 * GET /api/certificates/event/:eventId/attended
 * Admin: Fetch list of participants who attended the event (paginated and chunked for high volumes)
 */
const getAttendedParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;

    const { data: form } = await supabaseAdmin
      .from('forms')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle();

    if (!form?.id) {
      return res.status(200).json({ participants: [], totalAttended: 0, totalCertificatesSent: 0 });
    }

    // Use paginated retrieval to safely fetch high participant counts
    const submissions = await CertificateService.fetchAllAttendedSubmissions({
      formId: form.id,
    });

    const userIds = submissions.map((s) => s.user_id);
    const profileMap = await CertificateService.fetchProfilesInChunks(userIds);

    const participants = submissions.map((sub) => {
      const p = profileMap.get(sub.user_id);
      return {
        id: sub.id,
        userId: sub.user_id,
        name: CertificateService.getSubmissionName(sub.answers, p?.full_name),
        email: CertificateService.getSubmissionEmail(sub.answers, p?.email),
        ticketId: sub.ticket_id,
        submittedAt: sub.submitted_at,
        certificateSent: Boolean(sub.certificate_sent),
        certificateSentAt: sub.certificate_sent_at,
        certificateId: sub.certificate_id,
        answers: sub.answers,
      };
    });

    return res.status(200).json({
      participants,
      totalAttended: participants.length,
      totalCertificatesSent: participants.filter((p) => p.certificateSent).length,
    });
  } catch (err) {
    console.error('getAttendedParticipants error:', err);
    return res.status(500).json({ error: 'Failed to retrieve attended participants.' });
  }
};

/**
 * POST /api/certificates/dispatch
 * Admin: Start high-volume batch certificate generation and email dispatch
 */
const dispatchCertificates = async (req, res) => {
  try {
    const { eventId, submissionIds } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required.' });
    }

    const { jobId, total } = await CertificateService.startBatchDispatch({
      eventId,
      submissionIds: Array.isArray(submissionIds) && submissionIds.length > 0 ? submissionIds : null,
    });

    return res.status(200).json({
      message: `Batch certificate dispatch started for ${total} participants.`,
      jobId,
      total,
    });
  } catch (err) {
    console.error('dispatchCertificates error:', err);
    return res.status(400).json({ error: err.message || 'Failed to start certificate dispatch.' });
  }
};

/**
 * POST /api/certificates/jobs/:jobId/cancel
 * Admin: Cancel an ongoing batch generation job
 */
const cancelJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const cancelled = CertificateService.cancelBatchJob(jobId);

    if (!cancelled) {
      return res.status(400).json({ error: 'Job is not running or already completed.' });
    }

    return res.status(200).json({ message: 'Batch job successfully cancelled.' });
  } catch (err) {
    console.error('cancelJob error:', err);
    return res.status(500).json({ error: 'Failed to cancel job.' });
  }
};

/**
 * GET /api/certificates/jobs/:jobId
 * Admin: Poll live progress of batch certificate generation job
 */
const getJobProgress = async (req, res) => {
  try {
    const { jobId } = req.params;
    const progress = CertificateService.getJobProgress(jobId);

    if (!progress) {
      return res.status(404).json({ error: 'Job not found or already completed.' });
    }

    return res.status(200).json(progress);
  } catch (err) {
    console.error('getJobProgress error:', err);
    return res.status(500).json({ error: 'Failed to query job progress.' });
  }
};

/**
 * GET /api/certificates/my-certificates
 * Student: View certificates earned by current user
 */
const getMyCertificates = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: submissions, error } = await supabaseAdmin
      .from('form_submissions')
      .select('id, form_id, certificate_sent, certificate_sent_at, certificate_id, ticket_id')
      .eq('user_id', userId)
      .eq('certificate_sent', true);

    if (error) throw error;

    return res.status(200).json({ certificates: submissions || [] });
  } catch (err) {
    console.error('getMyCertificates error:', err);
    return res.status(500).json({ error: 'Failed to retrieve certificates.' });
  }
};

/**
 * GET /api/certificates/download/submission/:submissionId
 * Student & Admin: Download personalized certificate file (PDF or PNG)
 */
const downloadCertificateForSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. Fetch submission with form and event details
    const { data: submission, error: subError } = await supabaseAdmin
      .from('form_submissions')
      .select('id, form_id, user_id, answers, attended, submitted_at, ticket_id, certificate_sent, certificate_sent_at, certificate_id, forms(id, title, event_id, events(id, title, details))')
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      return res.status(404).json({ error: 'Event submission record not found.' });
    }

    // 2. Authorization: Current user must be the submission owner OR an admin
    if (submission.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to download this certificate.' });
    }

    // 3. Must have been dispatched/sent by admin via email
    if (!submission.certificate_sent) {
      return res.status(400).json({
        error: 'Certificate has not been issued yet. The download will become available once the certificate is sent to your email.',
      });
    }

    const eventId = submission.forms?.events?.id || submission.forms?.event_id;
    if (!eventId) {
      return res.status(400).json({ error: 'Associated event could not be identified.' });
    }

    // 4. Fetch certificate configuration for the event
    const config = await CertificateService.getEventConfig(eventId);

    // 5. Fetch attendee profile for name/email fallback
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', submission.user_id)
      .single();

    const toEmail = CertificateService.getSubmissionEmail(submission.answers, profile?.email);
    const attendeeName = CertificateService.getSubmissionName(submission.answers, profile?.full_name);
    const certId = submission.certificate_id || `CERT-GDG-${Date.now().toString(36).toUpperCase()}`;

    const attendeeData = {
      attendee_name: attendeeName,
      attendee_email: toEmail,
      event_title: config.eventTitle,
      event_date: new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
      ticket_id: submission.ticket_id || 'GDG-ATTENDED',
      certificate_id: certId,
      issue_date: submission.certificate_sent_at
        ? new Date(submission.certificate_sent_at).toLocaleDateString()
        : new Date().toLocaleDateString(),
      answers: submission.answers || {},
      ...(submission.answers || {}),
    };

    // Check in-memory bounded cache first to instantly serve repeated or concurrent downloads
    const cachedCert = certificateDownloadCache.get(submissionId);
    if (cachedCert && cachedCert.expiresAt > Date.now()) {
      res.setHeader('Content-Type', cachedCert.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${cachedCert.filename}"`);
      res.setHeader('Content-Length', cachedCert.buffer.length);
      return res.status(200).send(cachedCert.buffer);
    }

    // 6. Generate certificate via single-flight coalescing to avoid duplicate Python spawns
    let certResult;
    if (certificateInflightDownloads.has(submissionId)) {
      certResult = await certificateInflightDownloads.get(submissionId);
    } else {
      const genPromise = (async () => {
        return await CertificateService.runPythonGenerator({
          scriptCode: config.scriptCode,
          data: attendeeData,
          outputFormat: 'pdf',
        });
      })();

      certificateInflightDownloads.set(submissionId, genPromise);
      try {
        certResult = await genPromise;
      } finally {
        certificateInflightDownloads.delete(submissionId);
      }
    }

    const contentType = 'application/pdf';
    const cleanEventTitle = (config.eventTitle || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanAttendeeName = attendeeName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const downloadFilename = `Certificate_${cleanEventTitle}_${cleanAttendeeName}.pdf`;

    // Cache the generated buffer for 5 minutes
    certificateDownloadCache.set(submissionId, {
      buffer: certResult.buffer,
      filename: downloadFilename,
      contentType,
      expiresAt: Date.now() + CERT_DOWNLOAD_CACHE_TTL,
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('Content-Length', certResult.buffer.length);

    return res.status(200).send(certResult.buffer);
  } catch (err) {
    console.error('downloadCertificateForSubmission error:', err);
    return res.status(500).json({ error: err.message || 'Failed to download certificate.' });
  }
};

module.exports = {
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
};
