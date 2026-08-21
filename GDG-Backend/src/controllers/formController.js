const { supabaseAdmin } = require('../config/supabase');
const { logActivity } = require('../services/activityLogService');

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

  for (const field of schema.fields) {
    const fieldName = field.name || field.id;
    if (!fieldName) continue;

    const value = answers[fieldName];
    const isProvided = value !== undefined && value !== null && value !== '';

    // 1. Required Check
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
          if (!field.options.includes(value)) {
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
    const { event_id, title, schema } = req.body;

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

    const formSchema = schema && typeof schema === 'object' ? schema : {};

    const { data: form, error } = await supabaseAdmin
      .from('forms')
      .insert([
        {
          event_id,
          title: title.trim(),
          schema: formSchema,
          created_by: req.user.id,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

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
      form,
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
 * Authenticated: Get all forms associated with an event.
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

    return res.status(200).json({
      message: 'Forms retrieved successfully.',
      count: forms.length,
      forms,
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
 * Authenticated: Get form by ID (including schema).
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

    return res.status(200).json({
      message: 'Form retrieved successfully.',
      form,
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
 * Admin-only: Update a form schema or title.
 */
const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, schema } = req.body;

    const updatePayload = {};
    if (title && typeof title === 'string') updatePayload.title = title.trim();
    if (schema && typeof schema === 'object') updatePayload.schema = schema;

    const { data: form, error } = await supabaseAdmin
      .from('forms')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

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
 * POST /api/forms/:formId/submissions
 * Authenticated / Students: Submit answers for a form with dynamic schema validation.
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

    // 1. Verify form exists and retrieve its dynamic schema
    const { data: form, error: formErr } = await supabaseAdmin
      .from('forms')
      .select('id, event_id, title, schema')
      .eq('id', formId)
      .single();

    if (formErr || !form) {
      return res.status(404).json({
        error: 'Form not found.',
      });
    }

    // 2. Validate submitted answers strictly against the form's schema
    const validationResult = validateFormAnswers(form.schema, answers);
    if (!validationResult.isValid) {
      return res.status(400).json({
        error: 'Form submission validation failed.',
        validation_errors: validationResult.errors,
      });
    }

    // 3. Store submission in database
    const { data: submission, error } = await supabaseAdmin
      .from('form_submissions')
      .insert([
        {
          form_id: formId,
          user_id: req.user.id,
          answers,
          submitted_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
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
      details: { form_id: formId, event_id: form.event_id, submission_id: submission.id },
    });

    return res.status(201).json({
      message: 'Form submitted successfully.',
      submission,
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
 * Admin-only: View all submissions for a form.
 */
const getFormSubmissions = async (req, res) => {
  try {
    const { formId } = req.params;

    const { data: submissions, error } = await supabaseAdmin
      .from('form_submissions')
      .select('id, form_id, user_id, answers, submitted_at')
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
      submissions,
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
      .select('*')
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
      submissions,
    });
  } catch (error) {
    console.error('getMySubmissions error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching user submissions.',
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
  validateFormAnswers,
};
