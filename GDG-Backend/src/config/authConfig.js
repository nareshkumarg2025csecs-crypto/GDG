const dotenv = require('dotenv');

dotenv.config();

const adminSignupCode = process.env.ADMIN_SIGNUP_CODE;

if (!adminSignupCode) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL CONFIG ERROR: ADMIN_SIGNUP_CODE environment variable must be set in production to secure admin creation.'
    );
  } else if (process.env.NODE_ENV !== 'test') {
    console.warn(
      '⚠️ WARNING: ADMIN_SIGNUP_CODE is not set in environment variables. Admin signups will be rejected until configured.'
    );
  }
}

/**
 * Validates whether the provided code matches the configured ADMIN_SIGNUP_CODE.
 * Strictly checks process.env.ADMIN_SIGNUP_CODE with no hardcoded fallback.
 *
 * @param {string} candidateCode
 * @returns {boolean}
 */
const validateAdminSignupCode = (candidateCode) => {
  const secretCode = process.env.ADMIN_SIGNUP_CODE;
  if (!secretCode || typeof secretCode !== 'string' || !secretCode.trim()) {
    return false;
  }
  if (!candidateCode || typeof candidateCode !== 'string') {
    return false;
  }
  return candidateCode.trim() === secretCode.trim();
};

module.exports = {
  validateAdminSignupCode,
};
