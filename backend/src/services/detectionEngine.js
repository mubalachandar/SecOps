const crypto = require('crypto');
const net = require('net');
const { v4: uuidv4 } = require('uuid');
const { pool, query } = require('../config/database');
const { getJSON, setJSON } = require('../config/redis');
const logger = require('../utils/logger');
const alertService = require('./alertService');
const { correlationEngine } = require('./correlationEngine');

const RULE_CACHE_KEY = 'detection_rules:active';
const RULE_CACHE_TTL = 300;
const safeIp = (value) => net.isIP(String(value || '')) ? String(value) : null;
const getPath = (value, path) => String(path || '').split('.').reduce((current, key) => (current && Object.prototype.hasOwnProperty.call(current, key) ? current[key] : undefined), value);
const asArray = (value) => Array.isArray(value) ? value : [value];

class DetectionEngine {
  constructor() { this.rules = []; this.rulesLoadedAt = null; this.lastProcessedAt = null; this.loadingRules = null; this.matchWindows = new Map(); }

  async processEvent(cloudtrailEvent) {
    let client;
    try {
      const event = this.normalizeEvent(cloudtrailEvent);
      await this._ensureRules();
      const matches = this.rules.map((rule) => ({ rule, result: this.evaluateRule(rule, event) })).filter(({ rule, result }) => result.matched && this._passesThreshold(rule, event, result));
      if (!pool) throw new Error('DATABASE_URL is not configured');
      client = await pool.connect();
      await client.query('BEGIN');
      const inserted = await client.query(`INSERT INTO cloudtrail_events (event_id, event_name, event_source, event_time, aws_region, source_ip, user_identity, request_parameters, response_elements, error_code, error_message, raw_event, processed_at) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11, $12::jsonb, NOW()) ON CONFLICT (event_id) DO NOTHING RETURNING id`, [event.eventId, event.eventName, event.eventSource, event.eventTime, event.awsRegion, safeIp(event.sourceIPAddress), JSON.stringify(event.userIdentity || {}), JSON.stringify(event.requestParameters || {}), JSON.stringify(event.responseElements || {}), event.errorCode || null, event.errorMessage || null, JSON.stringify(event.rawEvent)]);
      if (!inserted.rowCount) { await client.query('ROLLBACK'); return { event, alerts: [], duplicate: true }; }
      const alerts = [];
      for (const { rule, result } of matches) alerts.push(await this.createAlert(rule, event, result.matchedPatterns, client, false));
      if (alerts.length) await client.query('UPDATE cloudtrail_events SET alert_id = $1 WHERE id = $2', [alerts[0].id, inserted.rows[0].id]);
      await client.query('COMMIT');
      this.lastProcessedAt = new Date().toISOString();
      for (const alert of alerts) this._triggerAnalysis(alert);
      return { event, alerts };
    } catch (error) {
      if (client) { try { await client.query('ROLLBACK'); } catch (rollbackError) { logger.error('Event transaction rollback failed', { error: rollbackError.message }); } }
      logger.error('CloudTrail event processing failed', { eventId: cloudtrailEvent?.eventID, error: error.message });
      throw error;
    } finally { if (client) client.release(); }
  }

  normalizeEvent(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('CloudTrail event must be an object.');
    const eventId = raw.eventID || raw.eventId || crypto.createHash('sha256').update(JSON.stringify(raw)).digest('hex');
    const eventTime = raw.eventTime || new Date().toISOString();
    if (!raw.eventName || !raw.eventSource) throw new Error('CloudTrail event requires eventName and eventSource.');
    return { eventId, eventName: raw.eventName, eventSource: raw.eventSource, eventTime: new Date(eventTime).toISOString(), awsRegion: raw.awsRegion || 'us-east-1', sourceIPAddress: raw.sourceIPAddress || raw.sourceIp || null, userAgent: raw.userAgent || null, userIdentity: raw.userIdentity || {}, requestParameters: raw.requestParameters || {}, responseElements: raw.responseElements || {}, errorCode: raw.errorCode || null, errorMessage: raw.errorMessage || null, resources: raw.resources || [], rawEvent: raw };
  }

  evaluateRule(rule, event) {
    try {
      const pattern = typeof rule.event_patterns === 'string' ? JSON.parse(rule.event_patterns) : rule.event_patterns;
      const result = this._evaluatePattern(pattern, event);
      return { matched: result.matched, matchedPatterns: result.matchedPatterns };
    } catch (error) { logger.warn('Detection rule evaluation failed', { ruleId: rule.rule_id, error: error.message }); return { matched: false, matchedPatterns: [] }; }
  }

  _evaluatePattern(pattern, event) {
    if (!pattern || typeof pattern !== 'object') return { matched: false, matchedPatterns: [] };
    if (Array.isArray(pattern)) return this._combine('AND', pattern, event);
    if (pattern.type === 'composite') return this._combine(pattern.operator || pattern.operatorType || 'AND', pattern.patterns || [], event);
    if (pattern.type) return this._matchTyped(pattern, event);
    const subPatterns = Object.entries(pattern).map(([field, value]) => {
      if (field === 'requestParametersContains') return { type: 'contains', field: 'requestParameters', value };
      return Array.isArray(value) ? { type: 'in_list', field, values: value } : { type: 'exact_match', field, value };
    });
    return this._combine('AND', subPatterns, event);
  }

  _combine(operator, patterns, event) {
    const outcomes = patterns.map((pattern) => this._evaluatePattern(pattern, event));
    const matched = String(operator).toUpperCase() === 'OR' ? outcomes.some((outcome) => outcome.matched) : outcomes.every((outcome) => outcome.matched);
    return { matched, matchedPatterns: matched ? outcomes.filter((outcome) => outcome.matched).flatMap((outcome) => outcome.matchedPatterns) : [] };
  }

  _matchTyped(pattern, event) {
    const field = pattern.field || pattern.path;
    const actual = getPath(event, field);
    const type = String(pattern.type).toLowerCase();
    let matched = false;
    if (type === 'exact_match') matched = String(actual) === String(pattern.value);
    else if (type === 'contains') matched = typeof actual === 'object' ? JSON.stringify(actual).includes(String(pattern.value)) : String(actual || '').includes(String(pattern.value));
    else if (type === 'in_list') matched = asArray(pattern.values || pattern.value).map(String).includes(String(actual));
    else if (type === 'regex') { try { matched = new RegExp(pattern.value, pattern.flags || '').test(String(actual || '')); } catch (error) { logger.warn('Invalid regex detection pattern', { value: pattern.value, error: error.message }); } }
    else if (type === 'json_path') { const nested = getPath(event, pattern.path || field); matched = pattern.operator === 'contains' ? String(nested || '').includes(String(pattern.value)) : String(nested) === String(pattern.value); }
    return { matched, matchedPatterns: matched ? [{ type, field, expected: pattern.values || pattern.value, actual }] : [] };
  }

  async createAlert(rule, event, matchedPatterns, executor = null, triggerAnalysis = true) {
    try {
      const db = executor || { query };
      const affectedResource = this._affectedResource(event);
      const alertId = `ALT-${uuidv4()}`;
      const result = await db.query(`INSERT INTO alerts (alert_id, severity, status, title, description, source, event_type, raw_event, mitre_tactic, mitre_technique, affected_resource, source_ip, user_agent, region, timestamp) VALUES ($1, $2, 'open', $3, $4, 'cloudtrail', $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13) RETURNING *`, [alertId, rule.severity, rule.name, `${rule.description} Matched patterns: ${JSON.stringify(matchedPatterns)}.`, event.eventName, JSON.stringify(event.rawEvent), rule.mitre_tactic, rule.mitre_technique, affectedResource, safeIp(event.sourceIPAddress), event.userAgent, event.awsRegion, event.eventTime]);
      const alert = result.rows[0];
      if (triggerAnalysis) this._triggerAnalysis(alert);

      try {
        const { websocketService } = require('./websocketService');
        websocketService.broadcastNewAlert(alert);
      } catch (wsError) {
        logger.error('WebSocket broadcast failed', { error: wsError.message });
      }

      // Asynchronously trigger correlation on new alert
      setImmediate(() => {
        correlationEngine.correlateAlerts().catch(err => {
          logger.error('Correlation failed after new alert', { error: err.message });
        });
        
        try {
          const { notificationService } = require('./notificationService');
          notificationService.notifyNewAlert(alert).catch(err => 
            logger.error('Notification failed', { error: err.message, alertId: alert.id })
          );
        } catch (e) {
          logger.error('Failed to trigger notification service', { error: e.message });
        }
      });

      return alert;
    } catch (error) { logger.error('Alert creation failed', { ruleId: rule.rule_id, eventId: event.eventId, error: error.message }); throw error; }
  }

  async processBatch(events) {
    try {
      if (!Array.isArray(events)) throw new Error('Events must be an array.');
      const results = await Promise.allSettled(events.map((event) => this.processEvent(event)));
      const fulfilled = results.filter((result) => result.status === 'fulfilled');
      return { total: events.length, processed: fulfilled.length, alertsGenerated: fulfilled.reduce((count, result) => count + result.value.alerts.length, 0), errors: results.flatMap((result, index) => result.status === 'rejected' ? [{ index, message: result.reason.message }] : []) };
    } catch (error) { logger.error('CloudTrail batch processing failed', { error: error.message }); throw error; }
  }

  async reloadRules() {
    try {
      const result = await query('SELECT * FROM detection_rules WHERE is_active = TRUE ORDER BY created_at ASC');
      this.rules = result.rows; this.rulesLoadedAt = new Date().toISOString();
      try { await setJSON(RULE_CACHE_KEY, this.rules, RULE_CACHE_TTL); } catch (error) { logger.warn('Rule cache write failed', { error: error.message }); }
      logger.info('Detection rules loaded', { activeRules: this.rules.length }); return this.rules;
    } catch (error) { logger.error('Detection rule reload failed', { error: error.message }); throw error; }
  }

  async getEngineStats() {
    try {
      await this._ensureRules();
      const result = await query(`SELECT (SELECT COUNT(*)::int FROM cloudtrail_events WHERE event_time >= date_trunc('day', NOW())) AS events_processed_today, (SELECT COUNT(*)::int FROM alerts WHERE created_at >= date_trunc('day', NOW())) AS alerts_generated_today`);
      const stats = { activeRules: this.rules.length, eventsProcessedToday: result.rows[0]?.events_processed_today || 0, alertsGeneratedToday: result.rows[0]?.alerts_generated_today || 0, lastProcessedAt: this.lastProcessedAt };

      try {
        const { websocketService } = require('./websocketService');
        // Removed broadcastEngineStats to prevent infinite loop
      } catch (wsError) {
        logger.error('WebSocket broadcast failed', { error: wsError.message });
      }

      return stats;
    } catch (error) { logger.error('Detection engine stats failed', { error: error.message }); throw error; }
  }

  async _ensureRules() {
    try {
      if (this.rules.length && this.rulesLoadedAt && Date.now() - new Date(this.rulesLoadedAt).getTime() < RULE_CACHE_TTL * 1000) return;
      if (!this.loadingRules) this.loadingRules = (async () => { try { const cached = await getJSON(RULE_CACHE_KEY); if (Array.isArray(cached)) { this.rules = cached; this.rulesLoadedAt = new Date().toISOString(); return; } await this.reloadRules(); } finally { this.loadingRules = null; } })();
      await this.loadingRules;
    } catch (error) { logger.error('Detection rules could not be initialized', { error: error.message }); throw error; }
  }
  _passesThreshold(rule, event, result) {
    const threshold = Math.max(1, Number(rule.threshold) || 1);
    if (threshold === 1) return true;
    const windowMinutes = Math.max(1, Number(rule.time_window_minutes) || 5);
    const identity = event.sourceIPAddress || event.userIdentity?.arn || event.userIdentity?.principalId || 'unknown';
    const key = `${rule.id || rule.rule_id}:${identity}`;
    const eventTime = new Date(event.eventTime).getTime(); const cutoff = eventTime - windowMinutes * 60000;
    const timestamps = (this.matchWindows.get(key) || []).filter((timestamp) => timestamp >= cutoff);
    timestamps.push(eventTime); this.matchWindows.set(key, timestamps);
    if (timestamps.length === threshold) result.matchedPatterns.push({ type: 'threshold', threshold, timeWindowMinutes: windowMinutes, matchedEvents: timestamps.length });
    return timestamps.length === threshold;
  }
  _affectedResource(event) { const request = event.requestParameters || {}; return request.bucketName || request.instanceId || request.userName || request.groupId || request.keyId || event.resources?.[0]?.ARN || event.resources?.[0]?.arn || null; }
  _triggerAnalysis(alert) {
    // To conserve API quota (max 1500 per day), only auto-analyze critical alerts in the background.
    // Lower severity alerts can be analyzed on-demand from the UI.
    if (alert.severity !== 'critical') return; 

    setImmediate(() => { 
      try { 
        require('./alertService').triggerAIAnalysis(alert.id).catch((error) => logger.error('Asynchronous alert analysis failed', { alertId: alert.id, error: error.message })); 
      } catch (error) { 
        logger.error('Asynchronous alert analysis dispatch failed', { alertId: alert.id, error: error.message }); 
      } 
    }); 
  }
}

module.exports = new DetectionEngine();
module.exports.DetectionEngine = DetectionEngine;
