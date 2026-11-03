const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Verify JWT Access Token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Authentication token missing. Please log in to proceed.',
        code: 'TOKEN_MISSING',
      });
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('+role +status +isEmailVerified');

    if (!user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'The user belonging to this token no longer exists.',
        code: 'USER_NOT_FOUND',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Your session has expired. Please refresh your token or log in again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return errorResponse(res, {
      statusCode: 401,
      message: 'Invalid authorization token.',
      code: 'TOKEN_INVALID',
    });
  }
};

/**
 * Restrict access to specific roles (e.g. 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(res, {
        statusCode: 403,
        message: `Forbidden: You do not have permissions (${roles.join(', ')}) to access this resource.`,
        code: 'FORBIDDEN_ROLE',
      });
    }
    next();
  };
};

/**
 * Ensure voter's KYC has been approved by election administration
 */
const requireApprovedVoter = (req, res, next) => {
  if (req.user.role === 'admin') return next();

  if (!req.user.isEmailVerified) {
    return errorResponse(res, {
      statusCode: 403,
      message: 'Please verify your email address with OTP before accessing this feature.',
      code: 'EMAIL_UNVERIFIED',
    });
  }

  if (req.user.status !== 'approved') {
    return errorResponse(res, {
      statusCode: 403,
      message: `Your voter registration is currently ${req.user.status.toUpperCase()}. An election official must approve your identity before voting.`,
      code: 'KYC_NOT_APPROVED',
      meta: { status: req.user.status, rejectionReason: req.user.rejectionReason },
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  requireApprovedVoter,
};

