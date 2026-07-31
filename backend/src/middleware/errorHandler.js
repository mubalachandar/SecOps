const logger = require('../utils/logger');

function errorHandler(error, req, res, next) {
  logger.error('Unhandled request error', { message: error.message, stack: error.stack, method: req.method, path: req.originalUrl, requestId: req.id });
  let status = error.status || error.statusCode || 500;
  let code = error.code || 'INTERNAL_SERVER_ERROR';
  let message = error.message || 'An unexpected error occurred.';
  if (error.name === 'ValidationError' || error.name === 'ZodError') { status = 400; code = 'VALIDATION_ERROR'; message = 'Request validation failed.'; }
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') { status = 401; code = 'AUTH_TOKEN_INVALID'; message = 'Authentication token is invalid or expired.'; }
  if (error.name === 'CastError') { status = 400; code = 'INVALID_INPUT'; message = 'One or more values have an invalid format.'; }
  const postgresErrors = { '23505': [409, 'RESOURCE_CONFLICT', 'A record with this value already exists.'], '23503': [409, 'REFERENCE_CONFLICT', 'This resource is still referenced by another record.'], '23502': [400, 'REQUIRED_FIELD_MISSING', 'A required field is missing.'], '22P02': [400, 'INVALID_INPUT', 'One or more values have an invalid format.'] };
  if (postgresErrors[error.code]) [status, code, message] = postgresErrors[error.code];
  const payload = { success: false, error: { code, message } };
  if (process.env.NODE_ENV === 'development') payload.error.details = error.details || error.stack;
  res.status(status).json(payload);
}

module.exports = errorHandler;
