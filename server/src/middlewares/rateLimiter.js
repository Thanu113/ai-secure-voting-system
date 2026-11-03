const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { errorResponse } = require('../utils/responseFormatter');

// Global API rate limiter
const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, {
      statusCode: 429,
      message: 'Too many requests from this IP address. Please try again after 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

// Stricter limiter for authentication endpoints (login, registration, OTP verify)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, {
      statusCode: 429,
      message: 'Too many login or verification attempts. Please wait 15 minutes before trying again.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    });
  },
});

// Voting submission rate limiter (prevent ballot flood)
const voteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, {
      statusCode: 429,
      message: 'Too many ballot submissions attempted. Please wait 15 minutes.',
      code: 'VOTE_RATE_LIMIT_EXCEEDED',
    });
  },
});

module.exports = {
  globalLimiter,
  authLimiter,
  voteLimiter,
};

