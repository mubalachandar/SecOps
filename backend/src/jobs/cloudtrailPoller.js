const cron = require('node-cron');
const { client: redisClient } = require('../config/redis');
const cloudtrailService = require('../services/cloudtrailService');
const logger = require('../utils/logger');

let pollTask = null;
let simulationTask = null;
let localLock = false;
const lockKey = 'cloudtrail_poller_lock';

async function acquireLock() {
  try {
    if (redisClient) return (await redisClient.set(lockKey, String(process.pid), 'EX', 240, 'NX')) === 'OK';
    if (localLock) return false;
    localLock = true;
    return true;
  } catch (error) { logger.error('CloudTrail poller lock acquisition failed', { error: error.message }); return false; }
}
async function releaseLock() {
  try { if (redisClient) await redisClient.del(lockKey); else localLock = false; }
  catch (error) { logger.error('CloudTrail poller lock release failed', { error: error.message }); }
}
async function poll() {
  if (!(await acquireLock())) { logger.info('CloudTrail poll skipped because another worker holds the lock'); return; }
  try {
    logger.info('CloudTrail poller started');
    const hasAwsConfiguration = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.CLOUDTRAIL_LOG_BUCKET);
      if (hasAwsConfiguration) {
      const result = await cloudtrailService.ingestFromS3(process.env.CLOUDTRAIL_LOG_BUCKET, process.env.CLOUDTRAIL_LOG_PREFIX || '');
      logger.info('CloudTrail poller completed S3 ingestion', result);
      try {
        const { websocketService } = require('../services/websocketService');
        const detectionEngine = require('../services/detectionEngine');
        const stats = await detectionEngine.getEngineStats();
        // websocketService.broadcastEngineStats(stats) is called inside getEngineStats
      } catch (wsError) {
        logger.error('WebSocket stats broadcast failed', { error: wsError.message });
      }
    } else logger.warn('CloudTrail poller skipped: AWS credentials and log bucket are not configured');
  } catch (error) { logger.error('CloudTrail poller run failed', { error: error.message }); }
  finally { await releaseLock(); }
}
async function simulateDevelopmentTraffic() {
  if (!(await acquireLock())) { logger.info('CloudTrail development simulation skipped because another worker holds the lock'); return; }
  try {
    const scenarios = ['root_login', 'brute_force', 'data_exfil', 'privilege_escalation', 'defense_evasion'];
    const scenarioName = scenarios[Math.floor(Math.random() * scenarios.length)];
    const events = await cloudtrailService.simulateCloudTrailEvents(scenarioName);
    const result = await cloudtrailService.ingestFromPayload(events);
    logger.info('CloudTrail development simulation completed', { scenarioName, ...result });
    try {
      const { websocketService } = require('../services/websocketService');
      const detectionEngine = require('../services/detectionEngine');
      const stats = await detectionEngine.getEngineStats();
      // websocketService.broadcastEngineStats(stats) is called inside getEngineStats
    } catch (wsError) {
      logger.error('WebSocket stats broadcast failed', { error: wsError.message });
    }
  } catch (error) { logger.error('CloudTrail development simulation failed', { error: error.message }); }
  finally { await releaseLock(); }
}
function startPolling() {
  if (pollTask || simulationTask) return;
  pollTask = cron.schedule('*/10 * * * * *', () => { poll().catch((error) => logger.error('Scheduled CloudTrail poll failed', { error: error.message })); });
  if ((!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.CLOUDTRAIL_LOG_BUCKET) && process.env.NODE_ENV !== 'production') simulationTask = cron.schedule('*/15 * * * *', () => { simulateDevelopmentTraffic().catch((error) => logger.error('Scheduled CloudTrail simulation failed', { error: error.message })); });
  logger.info('CloudTrail poller scheduled');
}
function stopPolling() { if (pollTask) { pollTask.stop(); pollTask = null; } if (simulationTask) { simulationTask.stop(); simulationTask = null; } logger.info('CloudTrail poller stopped'); }
module.exports = { startPolling, stopPolling, poll, simulateDevelopmentTraffic };
