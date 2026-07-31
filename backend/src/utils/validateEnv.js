const logger = require('./logger');

function validateEnv() {
  const requiredVars = [
    { name: 'NODE_ENV', purpose: 'Determines the execution environment (development/production)' },
    { name: 'PORT', purpose: 'The port the backend server listens on' },
    { name: 'DATABASE_URL', purpose: 'Connection string for the PostgreSQL database' },
    { name: 'REDIS_URL', purpose: 'Connection string for the Redis cache' },
    { name: 'GEMINI_API_KEY', purpose: 'API key for authenticating with Gemini AI services' },
    { name: 'JWT_SECRET', purpose: 'Secret key for signing JSON Web Tokens' },
    { name: 'FRONTEND_URL', purpose: 'Allowed origin for CORS' }
  ];

  const missingVars = requiredVars.filter(envVar => !process.env[envVar.name]);

  if (missingVars.length > 0) {
    missingVars.forEach(envVar => {
      logger.error(`Missing Environment Variable: ${envVar.name}`);
      logger.error(`↳ Purpose: ${envVar.purpose}`);
    });
    
    logger.error('CRITICAL: Server cannot start due to missing environment variables.');
    process.exit(1);
  }
}

module.exports = validateEnv;
