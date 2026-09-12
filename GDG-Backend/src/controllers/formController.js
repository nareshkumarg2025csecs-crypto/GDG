const { supabaseAdmin } = require('../config/supabase');
const { logActivity } = require('../services/activityLogService');
const GoogleSheetsService = require('../services/googleSheetsService');
const GoogleDriveService = require('../services/googleDriveService');
const EmailService = require('../services/emailService');

/**
 * Helper function to validate form submission answers against the form's dynamic schema.
 *
 * @param {object} schema - The JSONB schema defined on the form
 * @param {object} answers - The JSONB answers submitted by the user
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateFormAnswers = (schema, answers) => {
  const errors = [];

  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return {
      isValid: false,
      errors: ['Answers must be a valid JSON object with key-value pairs.'],
    };
  }

  // If no specific fields defined in schema, allow flexible JSONB object
  if (!schema || !schema.fields || !Array.isArray(schema.fields) || schema.fields.length === 0) {
    return { isValid: true, errors: [] };
  }

  // Iterate over each field defined in schema
  for (const field of schema.fields) {
    const fieldName = field.name || field.id;
    const value = answers[fieldName];

    // 1. Check Required Constraint
    const isProvided =
      value !== undefined &&
      value !== null &&
      (typeof value === 'string' ? value.trim() !== '' : true);

    if (field.required && !isProvided) {
      errors.push(`Field '${field.label || fieldName}' is required.`);
      continue;
    }

    if (!isProvided) {
      continue; // Optional field not provided, skip type checks
    }

    // 2. Type & Format Checks
    const fieldType = (field.type || 'text').toLowerCase();

    switch (fieldType) {
      case 'text':
      case 'string':
      case 'textarea':
        if (typeof value !== 'string') {
          errors.push(`Field '${field.label || fieldName}' must be a string.`);
        } else if (field.minLength && value.length < field.minLength) {
          errors.push(`Field '${field.label || fieldName}' must be at least ${field.minLength} characters.`);
        } else if (field.maxLength && value.length > field.maxLength) {
          errors.push(`Field '${field.label || fieldName}' must not exceed ${field.maxLength} characters.`);
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`Field '${field.label || fieldName}' must be a valid number.`);
        } else {
          if (field.min !== undefined && value < field.min) {
            errors.push(`Field '${field.label || fieldName}' must be at least ${field.min}.`);
          }
          if (field.max !== undefined && value > field.max) {
            errors.push(`Field '${field.label || fieldName}' must be at most ${field.max}.`);
          }
        }
        break;

      case 'boolean':
      case 'checkbox':
        if (typeof value !== 'boolean') {
          errors.push(`Field '${field.label || fieldName}' must be true or false.`);
        }
        break;

      case 'select':
      case 'radio':
        if (field.options && Array.isArray(field.options) && field.options.length > 0) {
          const hasOtherOption = field.options.some(
            (opt) => typeof opt === 'string' && opt.toLowerCase().startsWith('other')
          );
          const isOtherValue =
            typeof value === 'string' && value.trim().toLowerCase().startsWith('other');

          if (!field.options.includes(value) && !(hasOtherOption && isOtherValue)) {
            errors.push(
              `Field '${field.label || fieldName}' has invalid option '${value}'. Allowed options: [${field.options.join(', ')}].`
            );
          }
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value !== 'string' || !emailRegex.test(value)) {
          errors.push(`Field '${field.label || fieldName}' must be a valid email address.`);
        }
        break;

      case 'file':
        if (typeof value !== 'string' || !value.trim()) {
          if (typeof value === 'object' && value !== null && (value.url || value.webViewLink)) {
            // Valid file object structure
          } else {
            errors.push(`Field '${field.label || fieldName}' requires a valid file attachment URL.`);
          }
        }
        break;

      default:
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * POST /api/forms
 * Admin-only: Create a dynamic form for a specific event.
 */
const createForm = async (req, res) => {
  try {
    const { event_id, title, schema, opens_at, expires_at, submission_limit, show_submission_count } = req.body;

    if (!event_id || !title) {
      return res.status(400).json({
        error: 'Validation error: event_id and title are required.',
      });
    }

    // Verify event exists
    const { data: event, error: eventErr } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', event_id)
      .single();

    if (eventErr || !event) {
      return res.status(404).json({
        error: `Event not found with ID: ${event_id}`,
      });
    }

    const parsedLimit = submission_limit !== undefined
      ? (submission_limit === null || submission_limit === '' || Number(submission_limit) <= 0 ? null : parseInt(submission_limit, 10))
      : (schema?.submission_limit !== undefined
          ? (schema.submission_limit === null || schema.submission_limit === '' || Number(schema.submission_limit) <= 0 ? null : parseInt(schema.submission_limit, 10))
          : null);

    const formSchema = schema && typeof schema === 'object' ? { ...schema } : {};
    if (opens_at !== undefined) {
      formSchema.opens_at = opens_at || null;
    }
    if (expires_at) {
      formSchema.expires_at = expires_at;
    }
    if (parsedLimit !== undefined) {
      formSchema.submission_limit = parsedLimit;
    }
    if (show_submission_count !== undefined) {
      formSchema.show_submission_count = show_submission_count !== false;
    } else if (schema?.show_submission_count !== undefined) {
      formSchema.show_submission_count = schema.show_submission_count !== false;
    } else {
      formSchema.show_submission_count = true;
    }

    const insertPayload = {
      event_id,
      title: title.trim(),
      schema: formSchema,
      created_by: req.user.id,
      created_at: new Date().toISOString(),
    };

    if (opens_at !== undefined) {
      insertPayload.opens_at = opens_at || null;
    }
    if (expires_at) {
      insertPayload.expires_at = expires_at;
    }
    if (parsedLimit !== undefined) {
      insertPayload.submission_limit = parsedLimit;
    }

    let form;
    let error;
    try {
      const res = await supabaseAdmin
        .from('forms')
        .insert([insertPayload])
        .select()
        .single();
      form = res.data;
      error = res.error;

      // Graceful fallback if database columns opens_at or submission_limit are not yet migrated
      if (error && error.message && (error.message.includes('submission_limit') || error.message.includes('opens_at'))) {
        if (error.message.includes('submission_limit')) delete insertPayload.submission_limit;
        if (error.message.includes('opens_at')) delete insertPayload.opens_at;
        const retryRes = await supabaseAdmin
          .from('forms')
          .insert([insertPayload])
          .select()
          .single();
        form = retryRes.data;
        error = retryRes.error;
      }
    } catch (insertErr) {
      error = insertErr;
    }

    if (error) {
      console.error('Create Form Error:', error);
      return res.status(500).json({
        error: 'Failed to create form.',
        details: error.message,
      });
    }

    // Log the form_created activity
    await logActivity(req, {
      user_id: req.user.id,
      action: 'form_created',
      details: { form_id: form.id, event_id: form.event_id, title: form.title },
    });

    return res.status(201).json({
      message: 'Form created successfully for event.',
      form: {
        ...form,
        submission_limit: parsedLimit,
        submission_count: 0,
        is_full: false,
      },
    });
  } catch (error) {
    console.error('createForm error:', error);
    return res.status(500).json({
      error: 'Internal server error while creating form.',
    });
  }
};

/**
 * GET /api/events/:eventId/forms
 * Authenticated: Get all forms associated with an event, enriched with real submission count and slot limit status.
 */
const getFormsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const { data: forms, error } = await supabaseAdmin
      .from('forms')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch forms for event.',
        details: error.message,
      });
    }

    // Attach submission count and slot capacity status to each form
    const enrichedForms = await Promise.all(
      (forms || []).map(async (f) => {
        const { count } = await supabaseAdmin
          .from('form_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('form_id', f.id);

        const currentCount = count || 0;
        const limit = f.submission_limit !== undefined && f.submission_limit !== null
          ? f.submission_limit
          : (f.schema?.submission_limit !== undefined && f.schema?.submission_limit !== null ? f.schema.submission_limit : null);
        const parsedLimitNum = limit && Number(limit) > 0 ? Number(limit) : null;
        const isFull = parsedLimitNum ? currentCount >= parsedLimitNum : false;

        const opensAt = f.opens_at !== undefined && f.opens_at !== null
          ? f.opens_at
          : (f.schema?.opens_at || null);
        const isUpcoming = opensAt ? new Date() < new Date(opensAt) : false;

        const showCount = f.show_submission_count !== undefined
          ? f.show_submission_count
          : (f.schema?.show_submission_count !== false);

        return {
          ...f,
          opens_at: opensAt,
          is_upcoming: isUpcoming,
          submission_count: currentCount,
          submission_limit: parsedLimitNum,
          show_submission_count: showCount,
          is_full: isFull,
        };
      })
    );

    return res.status(200).json({
      message: 'Forms retrieved successfully.',
      count: enrichedForms.length,
      forms: enrichedForms,
    });
  } catch (error) {
    console.error('getFormsByEvent error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching forms.',
    });
  }
};

/**
 * GET /api/forms/:id
 * Authenticated: Get form by ID (including schema, submission count, slot status, and opening status).
 */
const getFormById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: form, error } = await supabaseAdmin
      .from('forms')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !form) {
      return res.status(404).json({
        error: 'Form not found.',
      });
    }

    const { count } = await supabaseAdmin
      .from('form_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('form_id', form.id);

    const currentCount = count || 0;
    const limit = form.submission_limit !== undefined && form.submission_limit !== null
      ? form.submission_limit
      : (form.schema?.submission_limit !== undefined && form.schema?.submission_limit !== null ? form.schema.submission_limit : null);
    const parsedLimitNum = limit && Number(limit) > 0 ? Number(limit) : null;
    const isFull = parsedLimitNum ? currentCount >= parsedLimitNum : false;

    const opensAt = form.opens_at !== undefined && form.opens_at !== null
      ? form.opens_at
      : (form.schema?.opens_at || null);
    const isUpcoming = opensAt ? new Date() < new Date(opensAt) : false;

    const showCount = form.show_submission_count !== undefined
      ? form.show_submission_count
      : (form.schema?.show_submission_count !== false);

    return res.status(200).json({
      message: 'Form retrieved successfully.',
      form: {
        ...form,
        opens_at: opensAt,
        is_upcoming: isUpcoming,
        submission_count: currentCount,
        submission_limit: parsedLimitNum,
        show_submission_count: showCount,
        is_full: isFull,
      },
    });
  } catch (error) {
    console.error('getFormById error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching form.',
    });
  }
};

/**
 * PUT /api/forms/:id
 * Admin-only: Update a form schema, title, expiration date, or submission limit.
 */
const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, schema, opens_at, expires_at, submission_limit, show_submission_count } = req.body;

    const parsedLimit = submission_limit !== undefined
      ? (submission_limit === null || submission_limit === '' || Number(submission_limit) <= 0 ? null : parseInt(submission_limit, 10))
      : (schema?.submission_limit !== undefined
          ? (schema.submission_limit === null || schema.submission_limit === '' || Number(schema.submission_limit) <= 0 ? null : parseInt(schema.submission_limit, 10))
          : undefined);

    const updatePayload = {};
    if (title && typeof title === 'string') updatePayload.title = title.trim();
    if (schema && typeof schema === 'object') {
      updatePayload.schema = { ...schema };
      if (opens_at !== undefined) {
        updatePayload.schema.opens_at = opens_at || null;
      }
      if (expires_at !== undefined) {
        updatePayload.schema.expires_at = expires_at;
      }
      if (parsedLimit !== undefined) {
        updatePayload.schema.submission_limit = parsedLimit;
      }
      if (show_submission_count !== undefined) {
        updatePayload.schema.show_submission_count = show_submission_count !== false;
      }
    } else if (opens_at !== undefined || expires_at !== undefined || parsedLimit !== undefined || show_submission_count !== undefined) {
      updatePayload.schema = {};
      if (opens_at !== undefined) updatePayload.schema.opens_at = opens_at || null;
      if (expires_at !== undefined) updatePayload.schema.expires_at = expires_at;
      if (parsedLimit !== undefined) updatePayload.schema.submission_limit = parsedLimit;
      if (show_submission_count !== undefined) updatePayload.schema.show_submission_count = show_submission_count !== false;
    }

    if (opens_at !== undefined) {
      updatePayload.opens_at = opens_at || null;
    }
    if (expires_at !== undefined) {
      updatePayload.expires_at = expires_at;
    }
    if (parsedLimit !== undefined) {
      updatePayload.submission_limit = parsedLimit;
    }

    let form;
    let error;
    try {
      const res = await supabaseAdmin
        .from('forms')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      form = res.data;
      error = res.error;

      // Graceful fallback if database columns opens_at or submission_limit are not yet migrated
      if (error && error.message && (error.message.includes('submission_limit') || error.message.includes('opens_at'))) {
        if (error.message.includes('submission_limit')) delete updatePayload.submission_limit;
        if (error.message.includes('opens_at')) delete updatePayload.opens_at;
        const retryRes = await supabaseAdmin
          .from('forms')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();
        form = retryRes.data;
        error = retryRes.error;
      }
    } catch (updateErr) {
      error = updateErr;
    }

    if (error || !form) {
      return res.status(404).json({
        error: 'Form not found or failed to update.',
        details: error ? error.message : undefined,
      });
    }

    // Log the form_updated activity
    await logActivity(req, {
      user_id: req.user.id,
      action: 'form_updated',
      details: { form_id: form.id, event_id: form.event_id, title: form.title },
    });

    return res.status(200).json({
      message: 'Form updated successfully.',
      form,
    });
  } catch (error) {
    console.error('updateForm error:', error);
    return res.status(500).json({
      error: 'Internal server error while updating form.',
    });
  }
};

/**
 * DELETE /api/forms/:id
 * Admin-only: Delete a form.
 */
const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: form, error } = await supabaseAdmin
      .from('forms')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error || !form) {
      return res.status(404).json({
        error: 'Form not found or already deleted.',
      });
    }

    // Log the form_deleted activity
    await logActivity(req, {
      user_id: req.user.id,
      action: 'form_deleted',
      details: { form_id: id, title: form.title },
    });

    return res.status(200).json({
      message: 'Form deleted successfully.',
      deleted_form: form,
    });
  } catch (error) {
    console.error('deleteForm error:', error);
    return res.status(500).json({
      error: 'Internal server error while deleting form.',
    });
  }
};

/**
 * Generates an event-specific alphanumeric prefix, e.g. "Boot Camp" -> "BC", "Smart India Hackathon" -> "SI", "Workshop" -> "WO"
 */
const generateTicketPrefix = (eventTitle) => {
  if (!eventTitle || typeof eventTitle !== 'string') return 'GD';
  const cleaned = eventTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    const initials = words.map((w) => w[0].toUpperCase()).slice(0, 2).join('');
    if (initials.length === 2) return initials;
  }

  if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return 'GD';
};

/**
 * POST /api/forms/:formId/submissions
 * Authenticated / Students: Submit answers for a form with dynamic schema validation,
 * strict server-side deadline enforcement, duplicate submission prevention,
 * sequential alphanumeric ticket ID assignment, and email dispatch status tracking.
 */
const submitForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return res.status(400).json({
        error: 'Validation error: answers object is required.',
      });
    }

    // 1. Verify form exists and retrieve its dynamic schema, expiry, and submission limit
    const { data: form, error: formErr } = await supabaseAdmin
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();

    if (formErr || !form) {
      return res.status(404).json({
        error: 'Form not found.',
      });
    }

    // 2. Server-side Manual Closure & Expiration Check (Zero client trust)
    if (form.schema?.is_open === false) {
      return res.status(410).json({
        error: 'Registration closed: Registrations for this event have been closed by the admin.',
      });
    }

    const openingTime = form.opens_at || form.schema?.opens_at;
    if (openingTime && new Date() < new Date(openingTime)) {
      return res.status(403).json({
        error: `Registration has not opened yet. Registration opens on ${new Date(openingTime).toLocaleString()}.`,
        is_upcoming: true,
        opens_at: openingTime,
      });
    }

    const expiryTime = form.expires_at || form.schema?.expires_at;
    if (expiryTime && new Date() > new Date(expiryTime)) {
      return res.status(410).json({
        error: 'Registration closed: The deadline to submit this form has passed.',
        expires_at: expiryTime,
      });
    }

    // 2.5 Server-side Form Submission Limit / Event Capacity Slot Check (Zero client trust)
    const rawLimit = form.submission_limit !== undefined && form.submission_limit !== null
      ? form.submission_limit
      : (form.schema?.submission_limit !== undefined && form.schema?.submission_limit !== null ? form.schema.submission_limit : null);
    const parsedSlotLimit = rawLimit && Number(rawLimit) > 0 ? Number(rawLimit) : null;

    if (parsedSlotLimit) {
      const { count: currentTotal } = await supabaseAdmin
        .from('form_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('form_id', formId);

      if ((currentTotal || 0) >= parsedSlotLimit) {
        return res.status(410).json({
          error: 'Event slot is full: All available registration seats have been filled. No more registrations are allowed.',
          is_full: true,
          submission_limit: parsedSlotLimit,
          current_count: currentTotal || 0,
        });
      }
    }

    // 3. Server-side Duplicate Prevention Check (Zero client trust)
    const { data: existingSubmission } = await supabaseAdmin
      .from('form_submissions')
      .select('id, submitted_at, ticket_id, answers')
      .eq('form_id', formId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (existingSubmission) {
      return res.status(409).json({
        error: 'Conflict: You have already submitted registration for this event.',
        submission_id: existingSubmission.id,
        submitted_at: existingSubmission.submitted_at,
        ticket_id: existingSubmission.ticket_id || existingSubmission.answers?.ticket_id,
      });
    }

    // 4. Validate submitted answers strictly against the form's schema
    const validationResult = validateFormAnswers(form.schema, answers);
    if (!validationResult.isValid) {
      return res.status(400).json({
        error: 'Form submission validation failed.',
        validation_errors: validationResult.errors,
      });
    }

    // 5. Generate Order-wise Alphanumeric Ticket ID (e.g. BC001, SI002, GD003)
    const { count: submissionCount } = await supabaseAdmin
      .from('form_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('form_id', formId);

    const { data: eventInfo } = await supabaseAdmin
      .from('events')
      .select('id, title, details')
      .eq('id', form.event_id)
      .single();

    const prefix = generateTicketPrefix(eventInfo?.title || form.title);
    const orderNum = (submissionCount || 0) + 1;
    let ticketId = `${prefix}${String(orderNum).padStart(3, '0')}`;

    // Ensure uniqueness by querying existing ticket IDs for this form
    const { data: existingFormSubs } = await supabaseAdmin
      .from('form_submissions')
      .select('ticket_id, answers')
      .eq('form_id', formId);

    const usedIds = new Set(
      (existingFormSubs || [])
        .map((s) => s.ticket_id || s.answers?.ticket_id)
        .filter(Boolean)
    );

    let seqCounter = orderNum;
    while (usedIds.has(ticketId)) {
      seqCounter++;
      ticketId = `${prefix}${String(seqCounter).padStart(3, '0')}`;
    }

    // Embed ticket_id and initial email_sent state inside answers
    const submissionAnswers = {
      ...answers,
      ticket_id: ticketId,
      email_sent: false,
    };

    // 6. Store submission in database (setting both table column ticket_id and answers.ticket_id)
    const { data: submission, error } = await supabaseAdmin
      .from('form_submissions')
      .insert([
        {
          form_id: formId,
          user_id: req.user.id,
          ticket_id: ticketId,
          email_sent: false,
          answers: submissionAnswers,
          submitted_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      // Check if duplicate key violation was caught by unique constraint
      if (error.code === '23505' || error.message.includes('unique') || error.message.includes('uq_form_submissions')) {
        return res.status(409).json({
          error: 'Conflict: You have already submitted registration for this event.',
        });
      }

      console.error('Submit Form Error:', error);
      return res.status(500).json({
        error: 'Failed to save form submission.',
        details: error.message,
      });
    }

    // Log the form submission
    await logActivity(req, {
      user_id: req.user.id,
      action: 'form_submitted',
      details: {
        form_id: formId,
        event_id: form.event_id,
        submission_id: submission.id,
        ticket_id: ticketId,
      },
    });

    // 7. Automated Email Confirmation Dispatch with Inline QR Pass
    let emailDispatched = false;
    let emailResult = null;

    const attendeeEmail = answers.email || req.user.email || req.user.profile?.email;
    const attendeeName =
      answers.full_name ||
      answers.name ||
      req.user.profile?.full_name ||
      attendeeEmail?.split('@')[0] ||
      'Attendee';

    try {
      if (attendeeEmail && attendeeEmail.includes('@')) {
        emailResult = await EmailService.sendRegistrationConfirmation({
          to: attendeeEmail,
          attendeeName,
          event: eventInfo || { id: form.event_id, title: form.title },
          submission: {
            ...submission,
            ticket_id: ticketId,
            answers: submissionAnswers,
          },
          form,
        });

        // Update email_sent state in both table column and answers
        if (emailResult && emailResult.success) {
          emailDispatched = true;
          await supabaseAdmin
            .from('form_submissions')
            .update({
              ticket_id: ticketId,
              email_sent: true,
              answers: {
                ...submissionAnswers,
                ticket_id: ticketId,
                email_sent: true,
                email_sent_at: new Date().toISOString(),
              },
            })
            .eq('id', submission.id);
          console.log(`[submitForm] Database updated with email_sent=true for submission ${submission.id} (${ticketId})`);
        } else if (emailResult && emailResult.queued) {
          console.log(`[submitForm] Registration email safely queued for submission ${submission.id} (${ticketId})`);
          await supabaseAdmin
            .from('form_submissions')
            .update({
              ticket_id: ticketId,
              email_sent: false,
              answers: {
                ...submissionAnswers,
                ticket_id: ticketId,
                email_queued: true,
                email_queue_id: emailResult.queueId,
              },
            })
            .eq('id', submission.id);
        }
      }

    } catch (emailErr) {
      console.warn('[submitForm] Automated email dispatch failed (non-blocking):', emailErr.message);
    }

    // Google Sheets Sync — fire-and-forget after successful submission
    if (form.schema?.sheets_url) {
      setImmediate(async () => {
        try {
          const { data: allSubmissions } = await supabaseAdmin
            .from('form_submissions')
            .select('id, user_id, answers, attended, submitted_at')
            .eq('form_id', formId)
            .order('submitted_at', { ascending: true });

          await GoogleSheetsService.syncSubmissionsToSheet({
            form,
            submissions: allSubmissions || [],
            requestingUserId: req.user.id,
          });
        } catch (syncErr) {
          console.warn('Background Google Sheets sync failed:', syncErr.message);
        }
      });
    }

    return res.status(201).json({
      message: 'Form submitted successfully.',
      submission: {
        ...submission,
        ticket_id: ticketId,
      },
      ticket_id: ticketId,
      email_dispatched: emailDispatched,
      confirmation_email_sent_to: attendeeEmail,
    });
  } catch (error) {
    console.error('submitForm error:', error);
    return res.status(500).json({
      error: 'Internal server error while submitting form.',
    });
  }
};

/**
 * GET /api/forms/:formId/submissions
 * Admin-only: View all submissions for a form (including attendance status).
 */
const getFormSubmissions = async (req, res) => {
  try {
    const { formId } = req.params;

    const { data: submissions, error } = await supabaseAdmin
      .from('form_submissions')
      .select('id, form_id, user_id, answers, attended, submitted_at')
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch form submissions.',
        details: error.message,
      });
    }

    return res.status(200).json({
      message: 'Form submissions fetched successfully.',
      count: submissions.length,
      submissions: submissions.map((s) => ({
        ...s,
        ticket_id: s.ticket_id || s.answers?.ticket_id || null,
        email_sent: s.email_sent !== undefined ? Boolean(s.email_sent) : Boolean(s.answers?.email_sent),
        attended: Boolean(s.attended),
      })),
    });
  } catch (error) {
    console.error('getFormSubmissions error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching submissions.',
    });
  }
};

/**
 * GET /api/forms/submissions/my
 * Authenticated: Get all submissions made by the current user.
 */
const getMySubmissions = async (req, res) => {
  try {
    const { data: submissions, error } = await supabaseAdmin
      .from('form_submissions')
      .select('id, form_id, user_id, answers, attended, submitted_at')
      .eq('user_id', req.user.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch your submissions.',
        details: error.message,
      });
    }

    return res.status(200).json({
      message: 'User submissions fetched successfully.',
      count: submissions.length,
      submissions: submissions.map((s) => ({
        ...s,
        ticket_id: s.ticket_id || s.answers?.ticket_id || null,
        email_sent: s.email_sent !== undefined ? Boolean(s.email_sent) : Boolean(s.answers?.email_sent),
        attended: Boolean(s.attended),
      })),
    });
  } catch (error) {
    console.error('getMySubmissions error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching user submissions.',
    });
  }
};

/**
 * PATCH /api/forms/submissions/:submissionId/attendance
 * Admin-only: Toggle/update student attendance for an event registration submission.
 */
const updateSubmissionAttendance = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { attended } = req.body;

    if (typeof attended !== 'boolean') {
      return res.status(400).json({
        error: 'Validation error: attended must be a boolean (true/false).',
      });
    }

    const { data: submission, error } = await supabaseAdmin
      .from('form_submissions')
      .update({ attended })
      .eq('id', submissionId)
      .select('id, form_id, user_id, answers, attended, submitted_at')
      .single();

    if (error || !submission) {
      return res.status(404).json({
        error: 'Submission not found or failed to update attendance.',
      });
    }

    await logActivity(req, {
      user_id: req.user.id,
      action: 'submission_attendance_updated',
      details: {
        submission_id: submission.id,
        user_id: submission.user_id,
        attended,
      },
    });

    return res.status(200).json({
      message: `Attendance marked as ${attended ? 'Attended' : 'Not Attended'}.`,
      submission: {
        ...submission,
        attended: Boolean(submission.attended),
      },
    });
  } catch (error) {
    console.error('updateSubmissionAttendance error:', error);
    return res.status(500).json({
      error: 'Internal server error while updating attendance.',
    });
  }
};

/**
 * POST /api/forms/:formId/sync-sheet
 * Admin-only: Trigger a full on-demand re-sync of all submissions to the linked Google Sheet.
 */
const syncSheetForAdmin = async (req, res) => {
  try {
    const { formId } = req.params;

    const { data: form, error: formErr } = await supabaseAdmin
      .from('forms')
      .select('id, event_id, title, schema, created_by')
      .eq('id', formId)
      .single();

    if (formErr || !form) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    const sheetsUrl = form.schema?.sheets_url;
    if (!sheetsUrl) {
      return res.status(400).json({
        error: 'This form does not have a Google Sheets URL configured.',
      });
    }

    const { data: submissions, error: subErr } = await supabaseAdmin
      .from('form_submissions')
      .select('id, user_id, answers, attended, submitted_at')
      .eq('form_id', formId)
      .order('submitted_at', { ascending: true });

    if (subErr) {
      return res.status(500).json({ error: 'Failed to fetch submissions for sync.', details: subErr.message });
    }

    const result = await GoogleSheetsService.syncSubmissionsToSheet({
      form,
      submissions: submissions || [],
      requestingUserId: req.user.id,
    });

    if (!result.success) {
      return res.status(502).json({ error: result.message });
    }

    return res.status(200).json({
      message: result.message,
      rows_synced: result.rows_synced,
    });
  } catch (error) {
    console.error('syncSheetForAdmin error:', error);
    return res.status(500).json({
      error: 'Internal server error while syncing Google Sheet.',
    });
  }
};

/**
 * GET /api/forms/ticket/:ticketId
 * Public/Authorized: Look up a registration pass by its alphanumeric ticket ID.
 * Returns submission, form, and event details so the attendee can view/download their ticket pass.
 */
const getTicketPass = async (req, res) => {
  try {
    const { ticketId } = req.params;
    if (!ticketId || typeof ticketId !== 'string') {
      return res.status(400).json({ error: 'Ticket ID is required.' });
    }

    const cleanTicketId = ticketId.trim().toUpperCase();

    // 1. Query submission by ticket_id column OR inside answers->ticket_id
    let { data: submission, error } = await supabaseAdmin
      .from('form_submissions')
      .select('id, form_id, user_id, answers, attended, submitted_at, ticket_id')
      .eq('ticket_id', cleanTicketId)
      .maybeSingle();

    if (!submission) {
      // Fallback: search in recent submissions
      const { data: fallbackSubs } = await supabaseAdmin
        .from('form_submissions')
        .select('id, form_id, user_id, answers, attended, submitted_at, ticket_id')
        .limit(100);

      submission = (fallbackSubs || []).find(
        (s) => (s.answers?.ticket_id || '').toUpperCase() === cleanTicketId
      );
    }

    if (!submission) {
      return res.status(404).json({ error: 'Ticket not found. Please verify your ticket ID.' });
    }

    // 2. Fetch Form and Event details
    const { data: form } = await supabaseAdmin
      .from('forms')
      .select('id, event_id, title, schema, expires_at')
      .eq('id', submission.form_id)
      .single();

    let event = null;
    if (form?.event_id) {
      const { data: eventData } = await supabaseAdmin
        .from('events')
        .select('id, title, details')
        .eq('id', form.event_id)
        .single();
      event = eventData;
    }

    return res.status(200).json({
      message: 'Ticket pass details retrieved successfully.',
      ticket_id: cleanTicketId,
      submission: {
        ...submission,
        ticket_id: cleanTicketId,
      },
      form,
      event,
    });
  } catch (error) {
    console.error('getTicketPass error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching ticket pass.' });
  }
};

/**
 * GET /api/forms/ticket/:ticketId/qr-download
 * Direct download of the QR code PNG pass image with Content-Disposition header.
 */
const downloadTicketQr = async (req, res) => {
  try {
    const { ticketId } = req.params;
    if (!ticketId) {
      return res.status(400).json({ error: 'Ticket ID is required.' });
    }
    const QRCode = require('qrcode');
    const cleanTicketId = ticketId.trim().toUpperCase();

    // Look up submission details
    let { data: submission } = await supabaseAdmin
      .from('form_submissions')
      .select('id, form_id, answers, submitted_at, ticket_id')
      .eq('ticket_id', cleanTicketId)
      .maybeSingle();

    if (!submission) {
      const { data: fallbackSubs } = await supabaseAdmin
        .from('form_submissions')
        .select('id, form_id, answers, submitted_at, ticket_id')
        .limit(100);

      submission = (fallbackSubs || []).find(
        (s) => (s.answers?.ticket_id || '').toUpperCase() === cleanTicketId
      );
    }

    const { data: form } = submission?.form_id
      ? await supabaseAdmin.from('forms').select('event_id, title').eq('id', submission.form_id).single()
      : { data: null };

    const { data: event } = form?.event_id
      ? await supabaseAdmin.from('events').select('title, details').eq('id', form.event_id).single()
      : { data: null };

    const eventTitle = event?.title || form?.title || 'GDG Event';
    const attendeeName = submission?.answers?.full_name || submission?.answers?.name || 'Attendee';
    const attendeeEmail = submission?.answers?.email || '';

    const qrText = [
      'GDG EVENT TICKET',
      '==============================',
      `Event: ${eventTitle}`,
      `Ticket ID: ${cleanTicketId}`,
      `Name: ${attendeeName}`,
      `Email: ${attendeeEmail}`,
      '==============================',
      'Google Developer Groups On Campus',
    ].join('\n');

    const qrBuffer = await QRCode.toBuffer(qrText, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="gdg-ticket-${cleanTicketId}.png"`);
    return res.status(200).send(qrBuffer);
  } catch (err) {
    console.error('downloadTicketQr error:', err);
    return res.status(500).json({ error: 'Failed to generate QR code image.' });
  }
};

/**
 * POST /api/forms/:formId/upload
 * Authenticated: Uploads a file for a form field to Google Drive into an event-specific folder.
 */
const uploadFormFile = async (req, res) => {
  try {
    const { formId } = req.params;
    const { fieldName } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    // 1. Verify form exists
    const { data: form, error: formErr } = await supabaseAdmin
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();

    if (formErr || !form) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    // 2. Fetch event title for folder naming
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('id, title')
      .eq('id', form.event_id)
      .maybeSingle();

    // 3. Find field schema and validate size & type limits
    const fields = form.schema?.fields || [];
    const targetField = fields.find(
      (f) => f.name === fieldName || f.id === fieldName || f.type === 'file'
    );

    if (targetField) {
      // Validate max file size
      const maxMb = targetField.max_file_size_mb || 10;
      const maxBytes = maxMb * 1024 * 1024;
      if (req.file.size > maxBytes) {
        return res.status(400).json({
          error: `File size exceeds the limit of ${maxMb}MB.`,
          max_size_mb: maxMb,
          actual_size_bytes: req.file.size,
        });
      }

      // Validate allowed file types if specified
      if (targetField.allowed_file_types && targetField.allowed_file_types !== '*' && targetField.allowed_file_types !== '') {
        const allowed = targetField.allowed_file_types
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);

        const fileName = (req.file.originalname || '').toLowerCase();
        const mime = (req.file.mimetype || '').toLowerCase();

        const isAllowed = allowed.some((rule) => {
          if (rule.startsWith('.')) {
            return fileName.endsWith(rule);
          }
          if (rule.endsWith('/*')) {
            const prefix = rule.slice(0, -1);
            return mime.startsWith(prefix);
          }
          return mime === rule;
        });

        if (!isAllowed) {
          return res.status(400).json({
            error: `Invalid file type. Allowed types: ${targetField.allowed_file_types}`,
            allowed_types: targetField.allowed_file_types,
          });
        }
      }
    }

    // 4. Resolve Google Drive access token from club/admin storage (NEVER student's personal account)
    const accessToken = await GoogleDriveService.getDriveAccessToken(form.created_by);
    if (!accessToken) {
      return res.status(503).json({
        error: 'Event file uploads are currently unavailable because the club Google Drive storage is not connected. Please notify an administrator to connect storage in the Admin Portal.',
        code: 'STORAGE_NOT_CONFIGURED',
      });
    }

    // 5. Get or create dedicated event folder in Google Drive
    const eventTitle = event?.title || form.title || 'Event';
    const { folderId } = await GoogleDriveService.getOrCreateEventFolder(accessToken, eventTitle, form.event_id);

    // 6. Upload file to event folder
    const attendeeName = req.user.profile?.full_name || req.user.email || 'Student';
    const uploadedFile = await GoogleDriveService.uploadFileToEventFolder({
      accessToken,
      folderId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      buffer: req.file.buffer,
      attendeeName,
    });

    return res.status(200).json({
      message: 'File uploaded to Google Drive successfully.',
      file: uploadedFile,
    });
  } catch (error) {
    console.error('uploadFormFile error:', error);
    const msg = error.message || '';
    if (msg.includes('storageQuotaExceeded') || msg.includes('storage quota has been exceeded')) {
      return res.status(507).json({
        error: 'Google Drive storage is full. Please notify event coordinators to switch the storage account.',
        code: 'STORAGE_QUOTA_EXCEEDED',
      });
    }

    if (msg.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') || msg.includes('insufficient authentication scopes')) {
      return res.status(503).json({
        error: 'Google Drive storage permission issue. Please reconnect the storage account with full Drive permissions in the Admin Portal.',
        code: 'INSUFFICIENT_STORAGE_SCOPES',
      });
    }

    return res.status(500).json({
      error: 'Unable to upload file to Google Drive. Please try again or contact the event coordinator.',
    });
  }
};

module.exports = {
  createForm,
  getFormsByEvent,
  getFormById,
  updateForm,
  deleteForm,
  submitForm,
  getFormSubmissions,
  getMySubmissions,
  updateSubmissionAttendance,
  syncSheetForAdmin,
  validateFormAnswers,
  getTicketPass,
  downloadTicketQr,
  uploadFormFile,
};
