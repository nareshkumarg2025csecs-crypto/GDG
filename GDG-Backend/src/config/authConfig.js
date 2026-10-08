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

// Scanner authentication strictly requires SCANNER_TOKEN_SECRET.
// Application startup must fail securely if SCANNER_TOKEN_SECRET is missing.
const scannerTokenSecret = process.env.SCANNER_TOKEN_SECRET;
if (!scannerTokenSecret || typeof scannerTokenSecret !== 'string' || !scannerTokenSecret.trim()) {
  throw new Error(
    'FATAL CONFIG ERROR: SCANNER_TOKEN_SECRET environment variable must be set. The scanner authentication service requires a dedicated HMAC secret.'
  );
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

/**
 * Resolves the secret key for signing and verifying scanner admin session tokens.
 * Strictly checks process.env.SCANNER_TOKEN_SECRET ONLY.
 * Never falls back to SUPABASE_SERVICE_ROLE_KEY or any hardcoded default secret.
 *
 * @returns {string}
 */
const getScannerTokenSecret = () => {
  const secret = process.env.SCANNER_TOKEN_SECRET;
  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    throw new Error(
      'FATAL CONFIG ERROR: SCANNER_TOKEN_SECRET environment variable must be set. Dedicated HMAC secret is strictly required for scanner authentication.'
    );
  }
  return secret.trim();
};

module.exports = {
  validateAdminSignupCode,
  getScannerTokenSecret,
};

