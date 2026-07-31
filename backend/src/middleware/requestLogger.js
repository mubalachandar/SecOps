const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
const logger = require('../utils/logger');

// Custom morgan format for development
morgan.token('reqId', (req) => req.id);
morgan.token('userId', (req) => req.user ? req.user.id : '-');
const devFormat = '\\x1b[36m[:date[iso]]\\x1b[0m \\x1b[33m:reqId\\x1b[0m :method :url \\x1b[32m:status\\x1b[0m :response-time ms - :res[content-length] (User: :userId)';

// Setup morgan middleware depending on env
const morganMiddleware = morgan(
  process.env.NODE_ENV === 'production' 
    ? (tokens, req, res) => {
        return JSON.stringify({
          requestId: tokens.reqId(req, res),
          method: tokens.method(req, res),
          path: tokens.url(req, res),
          statusCode: Number(tokens.status(req, res)),
          responseTime: Number(tokens['response-time'](req, res)),
          contentLength: tokens.res(req, res, 'content-length'),
          ip: req.ip,
          userAgent: req.get('user-agent'),
          userId: tokens.userId(req, res)
        });
      }
    : devFormat,
  {
    skip: (req) => req.path === '/health',
    stream: { write: (message) => logger.http(message.trim()) }
  }
);

function requestLogger(req, res, next) {
  if (req.path === '/health') return next();
  
  if (!req.id) req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  
  const startedAt = process.hrtime.bigint();
  
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    if (durationMs > 2000) {
      logger.warn('Slow request detected', {
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        ip: req.ip,
        userId: req.user?.id || null
      });
    }
  });
  
  morganMiddleware(req, res, next);
}

module.exports = requestLogger;
