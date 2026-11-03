const { errorResponse } = require('../utils/responseFormatter');
const env = require('../config/env');

const notFoundHandler = (req, res, next) => {
  return errorResponse(res, {
    statusCode: 404,
    message: `API endpoint not found: [${req.method}] ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
};

const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.name}: ${err.message}`);
  if (err.stack && env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Handle Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return errorResponse(res, {
      statusCode: 409,
      message: `A record with this ${field} already exists.`,
      code: 'DUPLICATE_KEY',
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return errorResponse(res, {
      statusCode: 400,
      message: messages.join('. '),
      code: 'DB_VALIDATION_ERROR',
    });
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, {
      statusCode: 400,
      message: `Invalid ID format for parameter: ${err.path}`,
      code: 'INVALID_ID_FORMAT',
    });
  }

  // Default internal server error
  return errorResponse(res, {
    statusCode: err.statusCode || 500,
    message: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

