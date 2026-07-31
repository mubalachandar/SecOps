const { query } = require('../config/database');
const geminiService = require('./geminiService');
const logger = require('../utils/logger');
const { correlationEngine } = require('./correlationEngine');

const allowedSorts = { createdAt: 'a.created_at', timestamp: 'a.timestamp', severity: 'a.severity', status: 'a.status', riskScore: 'a.risk_score' };
const transitions = { open: ['investigating', 'false_positive'], investigating: ['resolved', 'false_positive'], resolved: [], false_positive: [] };
const failure = (message, statusCode, code) => Object.assign(new Error(message), { statusCode, code });

class AlertService {
  async getAlerts(filters = {}, pagination = {}) {
    try {
      const values = []; const where = [];
      const add = (clause, value) => { values.push(value); where.push(clause.replace('?', `$${values.length}`)); };
      if (filters.severity) {
        const severities = Array.isArray(filters.severity) ? filters.severity.map(s => s.toLowerCase()) : [filters.severity.toLowerCase()];
        values.push(severities);
        where.push(`a.severity = ANY($${values.length})`);
      }
      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status.map(s => s.toLowerCase()) : [filters.status.toLowerCase()];
        values.push(statuses);
        where.push(`a.status = ANY($${values.length})`);
      }
      if (filters.source) add('a.source = ?', filters.source);
      if (filters.startDate) add('a.timestamp >= ?', filters.startDate);
      if (filters.endDate) add('a.timestamp <= ?', filters.endDate);
      if (filters.search) add('(a.title ILIKE ? OR a.description ILIKE ?)', `%${filters.search}%`), values.push(`%${filters.search}%`), where[where.length - 1] = `(a.title ILIKE $${values.length - 1} OR a.description ILIKE $${values.length})`;
      const page = Math.max(1, Number(pagination.page) || 1); const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
      const sortBy = allowedSorts[pagination.sortBy] || allowedSorts.createdAt; const sortOrder = String(pagination.sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC'; const condition = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const total = await query(`SELECT COUNT(*)::int AS total FROM alerts a ${condition}`, values);
      values.push(limit, (page - 1) * limit);
      const result = await query(`SELECT a.* FROM alerts a ${condition} ORDER BY ${sortBy} ${sortOrder} LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
      return { alerts: result.rows, total: total.rows[0].total, page, limit, totalPages: Math.ceil(total.rows[0].total / limit) };
    } catch (error) { logger.error('Alert list retrieval failed', { error: error.message }); throw error; }
  }

  async getAlertById(alertId) {
    try {
      const alertResult = await query('SELECT * FROM alerts WHERE id::text = $1 OR alert_id = $1', [alertId]);
      if (!alertResult.rowCount) throw failure('Alert not found.', 404, 'ALERT_NOT_FOUND');
      const analysis = await query('SELECT * FROM alert_analyses WHERE alert_id = $1 ORDER BY created_at DESC LIMIT 1', [alertResult.rows[0].id]);
      return { alert: alertResult.rows[0], analysis: analysis.rows[0] || null };
    } catch (error) { logger.warn('Alert lookup failed', { alertId, error: error.message }); throw error; }
  }

  async updateAlertStatus(alertId, status, userId, notes = '') {
    try {
      const current = await query('SELECT id, status FROM alerts WHERE id::text = $1 OR alert_id = $1', [alertId]);
      if (!current.rowCount) throw failure('Alert not found.', 404, 'ALERT_NOT_FOUND');
      if (!transitions[current.rows[0].status]?.includes(status)) throw failure(`Invalid status transition from ${current.rows[0].status} to ${status}.`, 400, 'INVALID_STATUS_TRANSITION');
      const resolved = ['resolved', 'false_positive'].includes(status);
      const result = await query(`UPDATE alerts SET status = $1, updated_at = NOW(), resolved_at = CASE WHEN $2 THEN NOW() ELSE NULL END, resolved_by = CASE WHEN $2 THEN $3 ELSE NULL END WHERE id = $4 RETURNING *`, [status, resolved, userId, current.rows[0].id]);
      await this._audit(userId, 'ALERT_STATUS_UPDATED', 'alert', current.rows[0].id, { status, notes });
      
      try {
        const { websocketService } = require('./websocketService');
        websocketService.broadcastAlertUpdate(result.rows[0]);
      } catch (wsError) {
        logger.error('WebSocket broadcast failed', { error: wsError.message });
      }

      return result.rows[0];
    } catch (error) { logger.warn('Alert status update failed', { alertId, error: error.message }); throw error; }
  }

  async getAlertAnalysis(alertId) {
    try { const record = await this.getAlertById(alertId); if (record.analysis) return record.analysis; return this.triggerAIAnalysis(record.alert.id); }
    catch (error) { logger.error('Alert analysis retrieval failed', { alertId, error: error.message }); throw error; }
  }

  async bulkUpdateStatus(alertIds, status, userId) {
    try {
      const outcomes = await Promise.allSettled(alertIds.map((id) => this.updateAlertStatus(id, status, userId)));
      return { updated: outcomes.filter((outcome) => outcome.status === 'fulfilled').map((outcome) => outcome.value), failed: outcomes.flatMap((outcome, index) => outcome.status === 'rejected' ? [{ alertId: alertIds[index], message: outcome.reason.message }] : []) };
    } catch (error) { logger.error('Bulk alert update failed', { error: error.message }); throw error; }
  }

  async getAlertStats() {
    try {
      const result = await query(`SELECT (SELECT COUNT(*)::int FROM alerts) AS total, (SELECT COUNT(*)::int FROM alerts WHERE created_at >= NOW() - INTERVAL '24 hours') AS last_24h, (SELECT COUNT(*)::int FROM alerts WHERE created_at >= NOW() - INTERVAL '7 days') AS last_7d, COALESCE((SELECT jsonb_object_agg(severity, count) FROM (SELECT severity, COUNT(*)::int AS count FROM alerts GROUP BY severity) severities), '{}'::jsonb) AS by_severity, COALESCE((SELECT jsonb_object_agg(status, count) FROM (SELECT status, COUNT(*)::int AS count FROM alerts GROUP BY status) statuses), '{}'::jsonb) AS by_status`);
      const row = result.rows[0] || {}; return { total: row.total || 0, bySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0, ...(row.by_severity || {}) }, byStatus: { open: 0, investigating: 0, resolved: 0, false_positive: 0, ...(row.by_status || {}) }, last24h: row.last_24h || 0, last7d: row.last_7d || 0 };
    } catch (error) { logger.error('Alert stats retrieval failed', { error: error.message }); throw error; }
  }

  async triggerAIAnalysis(alertId) {
    try {
      const record = await this.getAlertById(alertId); const analysis = await geminiService.analyzeAlert(record.alert);
      const actions = [...analysis.immediateActions, ...analysis.longTermActions];
      const saved = await query(`INSERT INTO alert_analyses (alert_id, analysis_text, risk_score, recommended_actions, false_positive_probability, ai_model, tokens_used) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7) RETURNING *`, [record.alert.id, JSON.stringify(analysis), analysis.riskScore, JSON.stringify(actions), analysis.falsePositiveProbability, geminiService.MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash', null]);
      await query('UPDATE alerts SET risk_score = $1, updated_at = NOW() WHERE id = $2', [analysis.riskScore, record.alert.id]);
      return saved.rows[0];
    } catch (error) { logger.error('AI analysis trigger failed', { alertId, error: error.message }); throw error; }
  }

  async _audit(userId, action, resourceType, resourceId, details) { try { await query('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES ($1, $2, $3, $4, $5::jsonb)', [userId, action, resourceType, resourceId, JSON.stringify(details)]); } catch (error) { logger.error('Alert audit log write failed', { error: error.message }); throw error; } }
}

module.exports = new AlertService();
module.exports.AlertService = AlertService;
