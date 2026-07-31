function success(res, data, message = 'Request completed successfully', statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, message });
}

function created(res, data, message = 'Resource created successfully') {
  return success(res, data, message, 201);
}

function error(res, message, statusCode = 400, details = null) {
  const payload = { success: false, error: { message } };
  if (details !== null) payload.error.details = details;
  return res.status(statusCode).json(payload);
}

function paginated(res, data, total, page, limit) {
  return res.status(200).json({ success: true, data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
}

module.exports = { success, created, error, paginated };
