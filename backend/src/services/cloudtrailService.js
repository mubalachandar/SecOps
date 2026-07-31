const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { promisify } = require('util');
const { gunzip } = require('zlib');
const { query } = require('../config/database');
const detectionEngine = require('./detectionEngine');
const logger = require('../utils/logger');
const gunzipAsync = promisify(gunzip);

const streamToBuffer = async (stream) => { const chunks = []; for await (const chunk of stream) chunks.push(Buffer.from(chunk)); return Buffer.concat(chunks); };
const makeEvent = ({ eventName, eventSource, identity, ip = '198.51.100.42', region = 'us-east-1', requestParameters = {}, responseElements = {}, errorCode = null, errorMessage = null, minutesAgo = 0 }) => ({ eventVersion: '1.08', userIdentity: identity, eventTime: new Date(Date.now() - minutesAgo * 60000).toISOString(), eventSource, eventName, awsRegion: region, sourceIPAddress: ip, userAgent: 'aws-cli/2.15.0 md/IO#Botocore/2.4.0 ua/2.0 os/linux#5.15.0', requestParameters, responseElements, errorCode, errorMessage, eventID: `${eventName}-${Date.now()}-${Math.random().toString(16).slice(2)}`, eventType: 'AwsApiCall', managementEvent: true, recipientAccountId: '123456789012' });
const root = { type: 'Root', principalId: '123456789012', arn: 'arn:aws:iam::123456789012:root', accountId: '123456789012', userName: 'root' };
const analyst = { type: 'IAMUser', principalId: 'AIDAEXAMPLESECOPS', arn: 'arn:aws:iam::123456789012:user/security-analyst', accountId: '123456789012', userName: 'security-analyst' };

class CloudTrailService {
  constructor() { 
    this.s3 = null; 
    // Start by only looking at events from the last 2 hours to avoid fetching historical data
    this.lastIngestTime = new Date(Date.now() - 2 * 60 * 60 * 1000); 
  }
  async ingestFromS3(bucketName, prefix = '') {
    try {
      if (!bucketName) throw new Error('A CloudTrail S3 bucket name is required.');
      const client = this._s3(); let continuationToken; let processed = 0; let errors = 0; let files = 0;
      let maxLastModified = this.lastIngestTime;
      do {
        const listed = await client.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: prefix, ContinuationToken: continuationToken }));
        for (const item of listed.Contents || []) {
          if (!item.Key?.endsWith('.json.gz')) continue;
          
          // Skip files we've already ingested
          if (this.lastIngestTime && item.LastModified <= this.lastIngestTime) continue;
          
          if (!maxLastModified || item.LastModified > maxLastModified) {
            maxLastModified = item.LastModified;
          }

          files += 1;
          try {
            const object = await client.send(new GetObjectCommand({ Bucket: bucketName, Key: item.Key }));
            const payload = JSON.parse((await gunzipAsync(await streamToBuffer(object.Body))).toString('utf8'));
            const summary = await detectionEngine.processBatch(payload.Records || []); processed += summary.processed; errors += summary.errors.length;
          } catch (error) { errors += 1; logger.error('CloudTrail S3 object ingestion failed', { bucketName, key: item.Key, error: error.message }); }
        }
        continuationToken = listed.IsTruncated ? listed.NextContinuationToken : null;
      } while (continuationToken);
      
      this.lastIngestTime = maxLastModified;
      return { bucketName, prefix, files, processed, errors };
    } catch (error) { logger.error('CloudTrail S3 ingestion failed', { bucketName, prefix, error: error.message }); throw error; }
  }
  async ingestFromPayload(events) {
    try {
      if (!Array.isArray(events)) throw Object.assign(new Error('events must be an array.'), { statusCode: 400, code: 'INVALID_EVENTS_PAYLOAD' });
      const invalid = events.map((event, index) => ({ event, index })).filter(({ event }) => !this._isValidEvent(event));
      if (invalid.length) throw Object.assign(new Error('One or more events are not valid CloudTrail records.'), { statusCode: 400, code: 'INVALID_CLOUDTRAIL_EVENT', details: invalid.map(({ index }) => ({ index })) });
      return detectionEngine.processBatch(events);
    } catch (error) { logger.warn('CloudTrail payload ingestion rejected', { error: error.message }); throw error; }
  }
  async simulateCloudTrailEvents(scenarioName) {
    try {
      const nowEvents = {
        root_login: [makeEvent({ eventName: 'ConsoleLogin', eventSource: 'signin.amazonaws.com', identity: root, ip: '185.220.101.34', region: 'us-east-1', responseElements: { ConsoleLogin: 'Success' } })],
        brute_force: Array.from({ length: 6 }, (_, index) => makeEvent({ eventName: 'ConsoleLogin', eventSource: 'signin.amazonaws.com', identity: analyst, ip: '203.0.113.77', errorCode: 'Failed authentication', errorMessage: 'Failed authentication', responseElements: { ConsoleLogin: 'Failure' }, minutesAgo: 5 - index })),
        data_exfil: [makeEvent({ eventName: 'PutBucketAcl', eventSource: 's3.amazonaws.com', identity: analyst, requestParameters: { bucketName: 'secops-sensitive-data-prod', AccessControlPolicy: { AccessControlList: { Grant: [{ Grantee: { URI: 'http://acs.amazonaws.com/groups/global/AllUsers' }, Permission: 'READ' }] } }, acl: 'PublicRead' }, responseElements: {} }), makeEvent({ eventName: 'GetObject', eventSource: 's3.amazonaws.com', identity: analyst, requestParameters: { bucketName: 'secops-sensitive-data-prod', key: 'exports/customer-data-2026-07.csv' }, responseElements: { bytesTransferredOut: 2147483648 }, minutesAgo: 1 })],
        privilege_escalation: [makeEvent({ eventName: 'CreateUser', eventSource: 'iam.amazonaws.com', identity: analyst, requestParameters: { userName: 'backup-automation' }, responseElements: { user: { arn: 'arn:aws:iam::123456789012:user/backup-automation' } }, minutesAgo: 2 }), makeEvent({ eventName: 'AttachUserPolicy', eventSource: 'iam.amazonaws.com', identity: analyst, requestParameters: { userName: 'backup-automation', policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess' }, responseElements: {}, minutesAgo: 1 })],
        defense_evasion: [makeEvent({ eventName: 'StopLogging', eventSource: 'cloudtrail.amazonaws.com', identity: analyst, requestParameters: { name: 'organization-trail' }, responseElements: {}, minutesAgo: 2 }), makeEvent({ eventName: 'AuthorizeSecurityGroupIngress', eventSource: 'ec2.amazonaws.com', identity: analyst, requestParameters: { groupId: 'sg-0a1b2c3d4e5f67890', ipPermissions: [{ ipProtocol: 'tcp', fromPort: 22, toPort: 22, ipRanges: [{ cidrIp: '0.0.0.0/0' }] }] }, responseElements: {}, minutesAgo: 1 })]
      };
      if (!nowEvents[scenarioName]) throw Object.assign(new Error('Unknown simulation scenario.'), { statusCode: 400, code: 'UNKNOWN_SIMULATION_SCENARIO' });
      return nowEvents[scenarioName];
    } catch (error) { logger.warn('CloudTrail simulation generation failed', { scenarioName, error: error.message }); throw error; }
  }
  async getEventStats(startDate, endDate) {
    try {
      const values = []; const where = [];
      if (startDate) { values.push(startDate); where.push(`event_time >= $${values.length}`); }
      if (endDate) { values.push(endDate); where.push(`event_time <= $${values.length}`); }
      const condition = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const [events, sources, regions, errors] = await Promise.all([query(`SELECT event_name AS name, COUNT(*)::int AS count FROM cloudtrail_events ${condition} GROUP BY event_name ORDER BY count DESC`, values), query(`SELECT event_source AS name, COUNT(*)::int AS count FROM cloudtrail_events ${condition} GROUP BY event_source ORDER BY count DESC`, values), query(`SELECT aws_region AS name, COUNT(*)::int AS count FROM cloudtrail_events ${condition} GROUP BY aws_region ORDER BY count DESC`, values), query(`SELECT COALESCE(error_code, 'none') AS name, COUNT(*)::int AS count FROM cloudtrail_events ${condition} GROUP BY error_code ORDER BY count DESC`, values)]);
      return { byEventName: events.rows, byEventSource: sources.rows, byRegion: regions.rows, byErrorCode: errors.rows };
    } catch (error) { logger.error('CloudTrail event stats failed', { error: error.message }); throw error; }
  }
  async getRecentEvents(limit = 20, offset = 0, filters = {}) {
    try {
      const values = []; const where = [];
      const filter = (column, value) => { if (value) { values.push(value); where.push(`${column} = $${values.length}`); } };
      filter('event_name', filters.eventName); filter('event_source', filters.eventSource); filter('aws_region', filters.awsRegion);
      if (filters.startDate) { values.push(filters.startDate); where.push(`event_time >= $${values.length}`); } if (filters.endDate) { values.push(filters.endDate); where.push(`event_time <= $${values.length}`); }
      const condition = where.length ? `WHERE ${where.join(' AND ')}` : ''; const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 20)); const normalizedOffset = Math.max(0, Number(offset) || 0);
      const count = await query(`SELECT COUNT(*)::int AS total FROM cloudtrail_events ${condition}`, values); values.push(normalizedLimit, normalizedOffset);
      const records = await query(`SELECT * FROM cloudtrail_events ${condition} ORDER BY event_time DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
      return { events: records.rows, total: count.rows[0].total, limit: normalizedLimit, offset: normalizedOffset };
    } catch (error) { logger.error('Recent CloudTrail events lookup failed', { error: error.message }); throw error; }
  }
  _s3() { if (!this.s3) this.s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' }); return this.s3; }
  _isValidEvent(event) { return Boolean(event && typeof event === 'object' && event.eventName && event.eventSource && event.eventTime && event.userIdentity && event.awsRegion !== undefined); }
}

module.exports = new CloudTrailService();
module.exports.CloudTrailService = CloudTrailService;
