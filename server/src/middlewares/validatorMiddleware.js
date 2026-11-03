const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Middleware that inspects express-validator results and returns a structured 400 error
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return errorResponse(res, {
      statusCode: 400,
      message: 'Validation failed for one or more fields.',
      errors: formattedErrors,
      code: 'VALIDATION_ERROR',
    });
  };
};

module.exports = {
  validate,
};

