const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { getJSON, setJSON } = require('../config/redis');
const logger = require('../utils/logger');

function sendAuthError(res, code, message, status = 401) { return res.status(status).json({ success: false, error: { code, message } }); }
function getToken(req) { const header = req.headers.authorization; return header && header.startsWith('Bearer ') ? header.slice(7).trim() : null; }
function jwtSecret() { if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) { const error = new Error('JWT_SECRET must be configured with at least 32 characters.'); error.code = 'JWT_CONFIGURATION_ERROR'; error.statusCode = 500; throw error; } return process.env.JWT_SECRET; }

async function loadActiveUser(userId) {
  try {
    const cacheKey = `user:${userId}`;
    try { const cached = await getJSON(cacheKey); if (cached) return cached; } catch (error) { logger.warn('User cache read failed', { userId, error: error.message }); }
    const result = await query('SELECT id, email, full_name, role, is_active, created_at, updated_at, last_login FROM users WHERE id = $1', [userId]);
    if (!result.rowCount) return null;
    const record = result.rows[0];
    const user = { id: record.id, email: record.email, fullName: record.full_name, role: record.role, isActive: record.is_active, createdAt: record.created_at, updatedAt: record.updated_at, lastLogin: record.last_login };
    try { await setJSON(cacheKey, user, 300); } catch (error) { logger.warn('User cache write failed', { userId, error: error.message }); }
    return user;
  } catch (error) { logger.error('Active user lookup failed', { userId, error: error.message }); throw error; }
}

async function authenticate(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) return sendAuthError(res, 'AUTH_TOKEN_MISSING', 'A Bearer token is required.');
    const payload = jwt.verify(token, jwtSecret(), { issuer: 'secops-ai-copilot', audience: 'secops-ai-copilot-api', algorithms: ['HS256'] });
    if (!payload.userId) return sendAuthError(res, 'AUTH_TOKEN_INVALID', 'Authentication token is invalid.');
    const user = await loadActiveUser(payload.userId);
    if (!user) return sendAuthError(res, 'AUTH_USER_NOT_FOUND', 'Authentication token is invalid.');
    if (!user.isActive) return sendAuthError(res, 'AUTH_ACCOUNT_DISABLED', 'Account disabled.', 403);
    req.user = user;
    return next();
  } catch (error) {
    if (error.statusCode) return next(error);
    logger.warn('Authentication failed', { error: error.message, path: req.originalUrl });
    return sendAuthError(res, error.name === 'TokenExpiredError' ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_TOKEN_INVALID', error.name === 'TokenExpiredError' ? 'Authentication token has expired.' : 'Authentication token is invalid.');
  }
}

function authorize(...roles) {
  const allowedRoles = roles.flat();
  return (req, res, next) => {
    if (!req.user) return sendAuthError(res, 'AUTH_REQUIRED', 'Authentication is required.');
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) return sendAuthError(res, 'AUTH_FORBIDDEN', 'You do not have permission to access this resource.', 403);
    return next();
  };
}

async function optionalAuth(req, res, next) {
  const token = getToken(req);
  if (!token) { req.user = null; return next(); }
  return authenticate(req, res, next);
}

module.exports = { authenticate, authorize, optionalAuth };
