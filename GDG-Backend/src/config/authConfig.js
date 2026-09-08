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

const crypto = require('crypto');

/**
 * Validates whether the provided code matches the configured ADMIN_SIGNUP_CODE.
 * Strictly checks process.env.ADMIN_SIGNUP_CODE with constant-time equality check
 * to protect against side-channel timing analysis attacks.
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

  // Hash both values to constant length 32-byte buffers to avoid length-leaking timing discrepancies
  const secretHash = crypto.createHash('sha256').update(secretCode.trim()).digest();
  const candidateHash = crypto.createHash('sha256').update(candidateCode.trim()).digest();

  return crypto.timingSafeEqual(secretHash, candidateHash);
};

module.exports = {
  validateAdminSignupCode,
};
