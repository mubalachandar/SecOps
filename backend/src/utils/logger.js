const fs = require('fs');
const path = require('path');
const winston = require('winston');

const logDirectory = path.resolve(process.cwd(), 'logs');
fs.mkdirSync(logDirectory, { recursive: true });
const isDevelopment = process.env.NODE_ENV !== 'production';
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => `${timestamp} ${level}: ${message}${Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : ''}`)
);
const productionFormat = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json());

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isDevelopment ? developmentFormat : productionFormat,
  defaultMeta: { service: 'secops-ai-copilot-api' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logDirectory, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDirectory, 'combined.log') })
  ],
  exceptionHandlers: [new winston.transports.File({ filename: path.join(logDirectory, 'exceptions.log') })],
  rejectionHandlers: [new winston.transports.File({ filename: path.join(logDirectory, 'rejections.log') })]
});

module.exports = logger;
