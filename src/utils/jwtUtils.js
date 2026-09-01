const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
const generateToken = (userId, expiresIn = process.env.JWT_EXPIRE || '7d') => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn
  });
};

/**
 * Generate verification token
 * @param {string} userId - User ID
 * @returns {string} Verification token
 */
const generateVerificationToken = (userId) => {
  return jwt.sign(
    { id: userId, purpose: 'verification' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_VERIFICATION_EXPIRE || '24h' }
  );
};

/**
 * Verify token
 * @param {string} token - JWT token
 * @returns {object} Decoded token
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateToken,
  generateVerificationToken,
  verifyToken
};
