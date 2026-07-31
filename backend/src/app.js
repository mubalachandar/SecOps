require('dotenv').config();
const validateEnv = require('./utils/validateEnv');
validateEnv();
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const routes = require('./routes');
const logger = require('./utils/logger');
const { generalLimiter } = require('./middleware/rateLimiter');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { testDatabaseConnection, pool } = require('./config/database');
const { client: redisClient } = require('./config/redis');
const { startPolling, stopPolling } = require('./jobs/cloudtrailPoller');
const { v4: uuidv4 } = require('uuid');
const { websocketService } = require('./services/websocketService');

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});


const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    logger.warn('CORS request from disallowed origin', { origin });
    return callback(new Error(`CORS: Origin ${origin} is not allowed`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  res.setHeader('X-API-Version', '1.0.0');
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

app.use(generalLimiter);
app.use(requestLogger);
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime(), version: process.env.npm_package_version || '1.0.0', environment: process.env.NODE_ENV || 'development' }));
app.use('/api/v1', routes);
app.use((req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} was not found.` } }));
app.use(errorHandler);

function startServer() {
  const port = Number(process.env.PORT || 5000);
  const server = http.createServer(app);
  
  websocketService.initializeWebSocket(server);

  server.on('error', (error) => logger.error('HTTP server error', { error: error.message, code: error.code }));
  server.listen(port, async () => { logger.info('SecOps API server started', { port, environment: process.env.NODE_ENV || 'development' }); await testDatabaseConnection(); startPolling(); });
  const shutdown = (signal) => {
    logger.info('Graceful shutdown initiated', { signal });
    stopPolling();
    server.close(async (error) => {
      if (error) logger.error('HTTP server shutdown error', { error: error.message });
      try { 
        if (redisClient) await redisClient.quit(); 
        if (pool) await pool.end(); 
        logger.info('Graceful shutdown complete');
      } catch (closeError) { 
        logger.error('Dependency shutdown error', { error: closeError.message }); 
      }
      process.exit(error ? 1 : 0);
    });
    setTimeout(() => { logger.error('Forced shutdown after 30s timeout'); process.exit(1); }, 30000).unref();
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
  return server;
}

if (require.main === module) startServer();
module.exports = { app, startServer };
