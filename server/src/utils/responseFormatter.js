/**
 * Standard API success response
 */
const successResponse = (res, { statusCode = 200, message = 'Success', data = null, meta = null }) => {
  const payload = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta }),
  };
  return res.status(statusCode).json(payload);
};

/**
 * Standard API error response
 */
const errorResponse = (res, { statusCode = 500, message = 'Internal Server Error', errors = null, code = null }) => {
  const payload = {
    success: false,
    message,
    ...(errors !== null && { errors }),
    ...(code !== null && { code }),
  };
  return res.status(statusCode).json(payload);
};

module.exports = {
  successResponse,
  errorResponse,
};

