const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// Redis-backed store for distributed rate limiting in multi-instance production.
// Falls back gracefully to in-memory store when Redis is not configured.
// NOTE: In-memory store is PER INSTANCE — counters reset on restart and are
// not shared between pods/containers. For Kubernetes/ECS with 2+ replicas,
// always configure REDIS_URL so the Redis store is used.
// ---------------------------------------------------------------------------
function buildStore(prefix) {
  if (!process.env.REDIS_URL) return undefined; // use in-memory (default)
  try {
    const { RedisStore } = require('rate-limit-redis');
    const { client } = require('../config/redis');
    if (!client) return undefined;
    logger.info(`Rate limiter: using Redis store for distributed rate limiting [${prefix}]`);
    return new RedisStore({ 
      sendCommand: (...args) => client.call(...args),
      prefix: prefix
    });
  } catch (err) {
    logger.warn('Rate limiter: Redis store unavailable, using in-memory store', { error: err.message });
    return undefined;
  }
}

const standardOptions = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.' } });
  }
};

const isDevelopment = process.env.NODE_ENV !== 'production';

const generalLimiter = rateLimit({
  ...standardOptions,
  store: buildStore('rl_general:'),
  skip: () => isDevelopment,
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  limit: Number(process.env.RATE_LIMIT_MAX || 100)
});

const authLimiter = rateLimit({
  ...standardOptions,
  store: buildStore('rl_auth:'),
  skip: () => isDevelopment,
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
  handler: (req, res) => {
    res.status(429).json({ success: false, error: { code: 'AUTH_RATE_LIMIT_EXCEEDED', message: 'Too many authentication attempts. Please try again later.' } });
  }
});

module.exports = { generalLimiter, authLimiter };
