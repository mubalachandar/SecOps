const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisUrl = process.env.REDIS_URL?.replace(/^REDIS_URL=/, '');
let redisAvailable = false;

const client = redisUrl ? new Redis(redisUrl, { 
  lazyConnect: false, 
  maxRetriesPerRequest: 3, 
  enableOfflineQueue: true,
  retryDelayOnFailover: 100,
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
  retryStrategy: (attempt) => Math.min(attempt * 200, 2000)
}) : null;

if (client) {
  client.on('connect', () => { logger.info('Redis connection established'); redisAvailable = true; });
  client.on('ready', () => { logger.info('Redis client ready'); redisAvailable = true; });
  client.on('error', (error) => { logger.error('Redis connection error', { error: error.message }); redisAvailable = false; });
  client.on('close', () => { logger.warn('Redis connection closed'); redisAvailable = false; });
  client.on('reconnecting', () => { logger.info('Redis reconnecting...'); });
} else {
  logger.warn('REDIS_URL is not configured; cache features are disabled');
}

function isRedisAvailable() {
  return redisAvailable;
}

async function get(key) { 
  if (!client) return null; 
  try { return await client.get(key); } 
  catch (error) { logger.warn('Redis get failed', { key, error: error.message }); return null; }
}

async function set(key, value, ttlSeconds) { 
  if (!client) return null; 
  try { return ttlSeconds ? await client.set(key, value, 'EX', ttlSeconds) : await client.set(key, value); }
  catch (error) { logger.warn('Redis set failed', { key, error: error.message }); return null; }
}

async function del(key) { 
  if (!client) return 0; 
  try { return await client.del(key); }
  catch (error) { logger.warn('Redis del failed', { key, error: error.message }); return 0; }
}

async function exists(key) { 
  if (!client) return 0; 
  try { return await client.exists(key); }
  catch (error) { logger.warn('Redis exists failed', { key, error: error.message }); return 0; }
}

async function setJSON(key, value, ttlSeconds) { 
  return set(key, JSON.stringify(value), ttlSeconds); 
}

async function getJSON(key) { 
  const value = await get(key); 
  if (!value) return null; 
  try { return JSON.parse(value); } 
  catch (error) { logger.warn('Invalid JSON found in Redis', { key, error: error.message }); return null; } 
}

module.exports = { client, get, set, del, exists, setJSON, getJSON, isRedisAvailable };
