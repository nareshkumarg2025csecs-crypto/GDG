const { body, query, param, validationResult } = require('express-validator');

/**
 * Middleware that checks validation results and returns standardized 400 response.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array().map((err) => err.msg);
    return res.status(400).json({
      error: `Validation error: ${errorList.join(', ')}`,
      details: errorList,
    });
  }
  next();
};

// 1. Auth Validation Chains
const validateStudentSignup = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/)
    .withMessage('Password must contain at least one symbol or special character'),
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 100 })
    .withMessage('Full name cannot exceed 100 characters'),
  body('details')
    .optional()
    .isObject()
    .withMessage('Details must be an object'),
  validate,
];

const validateAdminSignup = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/)
    .withMessage('Password must contain at least one symbol or special character'),
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 100 })
    .withMessage('Full name cannot exceed 100 characters'),
  body('details')
    .optional()
    .isObject()
    .withMessage('Details must be an object'),
  validate,
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate,
];

// 2. Events Validation Chains
const validateCreateEvent = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 250 })
    .withMessage('Title must not exceed 250 characters'),
  body('details')
    .optional()
    .isObject()
    .withMessage('Details must be a valid JSON object'),
  validate,
];

const validateUpdateEvent = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Event ID parameter is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 250 })
    .withMessage('Title must be between 1 and 250 characters'),
  body('details')
    .optional()
    .isObject()
    .withMessage('Details must be a valid JSON object'),
  validate,
];

// 3. Forms Validation Chains
const validateCreateForm = [
  body('event_id')
    .trim()
    .notEmpty()
    .withMessage('event_id is required')
    .isUUID()
    .withMessage('event_id must be a valid UUID'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Form title is required')
    .isLength({ max: 250 })
    .withMessage('Form title must not exceed 250 characters'),
  body('schema')
    .optional()
    .isObject()
    .withMessage('Schema must be a valid JSON object'),
  validate,
];

const validateSubmitForm = [
  param('formId')
    .trim()
    .notEmpty()
    .withMessage('Form ID is required')
    .isUUID()
    .withMessage('Form ID must be a valid UUID'),
  body('answers')
    .isObject()
    .withMessage('Answers must be a valid JSON object'),
  validate,
];

module.exports = {
  validateStudentSignup,
  validateAdminSignup,
  validateLogin,
  validateCreateEvent,
  validateUpdateEvent,
  validateCreateForm,
  validateSubmitForm,
};
