const { query } = require('../config/database');
const { getJSON, setJSON, del } = require('../config/redis');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { detectionEngine } = require('./detectionEngine');

// Safe fallback for detectionEngine and logger in case they are not exported as destructured objects
const engine = detectionEngine || require('./detectionEngine');
const log = logger || require('../utils/logger');

class RulesService {
  async getRules(filters = {}, pagination = {}) {
    try {
      const { severity, isActive, mitreTactic, search } = filters;
      const page = Math.max(1, parseInt(pagination.page, 10) || 1);
      const limit = Math.max(1, parseInt(pagination.limit, 10) || 20);
      const offset = (page - 1) * limit;

      const clauses = [];
      const params = [];
      let idx = 1;

      if (severity) {
        clauses.push(`severity = $${idx++}`);
        params.push(severity);
      }
      if (isActive !== undefined && isActive !== null) {
        // Handle boolean isActive correctly
        const activeBool = isActive === 'true' || isActive === true;
        clauses.push(`is_active = $${idx++}`);
        params.push(activeBool);
      }
      if (mitreTactic) {
        clauses.push(`mitre_tactic = $${idx++}`);
        params.push(mitreTactic);
      }
      if (search) {
        clauses.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
        params.push(`%${search}%`);
        idx++;
      }

      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

      const countQuery = `SELECT COUNT(*)::int AS total FROM detection_rules ${where}`;
      const countResult = await query(countQuery, params);
      const total = parseInt(countResult.rows[0].total, 10) || 0;

      const rulesQuery = `SELECT * FROM detection_rules ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
      const rulesResult = await query(rulesQuery, [...params, limit, offset]);

      return {
        rules: rulesResult.rows,
        total,
        page,
        limit
      };
    } catch (err) {
      log.error('RulesService.getRules failed', {
        error: err.message,
        stack: err.stack
      });
      throw err;
    }
  }

  async getRuleById(ruleId) {
    try {
      const result = await query('SELECT * FROM detection_rules WHERE id = $1', [ruleId]);
      if (result.rows.length === 0) {
        throw new Error('Rule not found');
      }
      return result.rows[0];
    } catch (err) {
      log.error('RulesService.getRuleById failed', {
        error: err.message,
        stack: err.stack
      });
      throw err;
    }
  }

  async createRule(ruleData, createdBy) {
    try {
      const { name, description, severity, mitre_tactic, mitre_technique, event_patterns, threshold = 1, time_window_minutes = 60 } = ruleData;
      
      // Validation
      if (!name || typeof name !== 'string' || name.length < 3 || name.length > 100) {
        throw new Error('Validation: name must be a string between 3 and 100 characters');
      }
      if (!description || typeof description !== 'string' || description.length < 10 || description.length > 500) {
        throw new Error('Validation: description must be a string between 10 and 500 characters');
      }
      if (!severity || !['critical', 'high', 'medium', 'low'].includes(severity)) {
        throw new Error('Validation: severity must be one of critical, high, medium, low');
      }
      if (!mitre_tactic || typeof mitre_tactic !== 'string') {
        throw new Error('Validation: mitre_tactic is required and must be a string');
      }
      if (!mitre_technique || typeof mitre_technique !== 'string') {
        throw new Error('Validation: mitre_technique is required and must be a string');
      }
      if (!event_patterns || typeof event_patterns !== 'object' || Array.isArray(event_patterns)) {
        throw new Error('Validation: event_patterns must be a valid JSON object');
      }
      if (threshold !== undefined && (!Number.isInteger(threshold) || threshold < 1)) {
        throw new Error('Validation: threshold must be an integer >= 1');
      }
      if (time_window_minutes !== undefined && (!Number.isInteger(time_window_minutes) || time_window_minutes < 1)) {
        throw new Error('Validation: time_window_minutes must be an integer >= 1');
      }

      const id = uuidv4();
      const rule_id = 'RULE-' + Date.now();

      const insertResult = await query(
        `INSERT INTO detection_rules 
           (id, rule_id, name, description, severity, mitre_tactic, mitre_technique, event_patterns, threshold, time_window_minutes, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW()) RETURNING *`,
        [id, rule_id, name, description, severity, mitre_tactic, mitre_technique, JSON.stringify(event_patterns), threshold, time_window_minutes]
      );

      await engine.reloadRules();

      const auditId = uuidv4();
      await query(
        `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [auditId, createdBy, 'RULE_CREATED', 'detection_rule', id, JSON.stringify({ name, severity }), new Date().toISOString()]
      );

      log.info('Rule created', { ruleId: id, name });
      
      return insertResult.rows[0];
    } catch (err) {
      log.error('RulesService.createRule failed', {
        error: err.message,
        stack: err.stack
      });
      throw err;
    }
  }

  async updateRule(ruleId, updates, updatedBy) {
    try {
      await this.getRuleById(ruleId); // verify rule exists

      const allowedFields = ['name', 'description', 'severity', 'mitre_tactic', 'mitre_technique', 'event_patterns', 'threshold', 'time_window_minutes'];
      const setClauses = [];
      const params = [];
      let idx = 1;

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          setClauses.push(`${field} = $${idx++}`);
          const value = field === 'event_patterns' ? JSON.stringify(updates[field]) : updates[field];
          params.push(value);
        }
      }

      if (setClauses.length === 0) {
        return await this.getRuleById(ruleId);
      }

      setClauses.push(`updated_at = NOW()`);
      
      const updateResult = await query(
        `UPDATE detection_rules SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
        [...params, ruleId]
      );

      await engine.reloadRules();

      await query(
        `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuidv4(), updatedBy, 'RULE_UPDATED', 'detection_rule', ruleId, JSON.stringify(updates), new Date().toISOString()]
      );

      return updateResult.rows[0];
    } catch (err) {
      log.error('RulesService.updateRule failed', {
        error: err.message,
        stack: err.stack
      });
      throw err;
    }
  }

  async deleteRule(ruleId, deletedBy) {
    try {
      await query(
        `UPDATE detection_rules 
         SET is_active = false, updated_at = NOW() 
         WHERE id = $1`,
        [ruleId]
      );

      await engine.reloadRules();

      await query(
        `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuidv4(), deletedBy, 'RULE_DELETED', 'detection_rule', ruleId, JSON.stringify({}), new Date().toISOString()]
      );

      log.warn('Rule soft-deleted', { ruleId });
      
      return { message: 'Rule deleted successfully' };
    } catch (err) {
      log.error('RulesService.deleteRule failed', {
        error: err.message,
        stack: err.stack
      });
      throw err;
    }
  }

  async toggleRule(ruleId, isActive, updatedBy) {
    try {
      const updateResult = await query(
        `UPDATE detection_rules 
         SET is_active = $1, updated_at = NOW() 
         WHERE id = $2 RETURNING *`,
        [isActive, ruleId]
      );

      await engine.reloadRules();

      await query(
        `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuidv4(), updatedBy, 'RULE_TOGGLED', 'detection_rule', ruleId, JSON.stringify({ isActive }), new Date().toISOString()]
      );

      return updateResult.rows[0];
    } catch (err) {
      log.error('RulesService.toggleRule failed', {
        error: err.message,
        stack: err.stack
      });
      throw err;
    }
  }

  async testRule(ruleData, sampleEvent) {
    try {
      // Allow evaluation regardless of if it's synchronous or asynchronous.
      const result = await engine.evaluateRule(ruleData, sampleEvent);
      
      let explanation = 'No patterns matched in sample event';
      if (result.matched) {
        const patternsList = result.matchedPatterns ? JSON.stringify(result.matchedPatterns) : '[]';
        explanation = `Rule matched on patterns: ${patternsList}`;
      }

      return {
        matched: !!result.matched,
        matchedPatterns: result.matchedPatterns || [],
        explanation
      };
    } catch (err) {
      log.error('RulesService.testRule failed', {
        error: err.message,
        stack: err.stack
      });
      throw err;
    }
  }

  async getRuleStats() {
    try {
      const cacheKey = 'rules:stats';
      const cached = await getJSON(cacheKey);
      if (cached) {
        return cached;
      }

      const totalActiveQuery = await query(`
        SELECT 
          COUNT(*)::int as total,
          SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END)::int as active
        FROM detection_rules
      `);

      const severityQuery = await query(`
        SELECT severity, COUNT(*)::int as count
        FROM detection_rules
        GROUP BY severity
      `);

      const tacticQuery = await query(`
        SELECT mitre_tactic, COUNT(*)::int as count
        FROM detection_rules
        GROUP BY mitre_tactic
        ORDER BY count DESC
        LIMIT 10
      `);

      const topTriggeredQuery = await query(`
        SELECT 
          dr.id as rule_id,
          dr.name as rule_name,
          COUNT(a.id)::int as trigger_count
        FROM detection_rules dr
        LEFT JOIN alerts a ON a.mitre_technique = dr.mitre_technique
        GROUP BY dr.id, dr.name
        ORDER BY trigger_count DESC
        LIMIT 5
      `);

      const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
      severityQuery.rows.forEach(row => {
        if (row.severity) {
          bySeverity[row.severity] = parseInt(row.count, 10) || 0;
        }
      });

      const byMitreTactic = {};
      tacticQuery.rows.forEach(row => {
        if (row.mitre_tactic) {
          byMitreTactic[row.mitre_tactic] = parseInt(row.count, 10) || 0;
        }
      });

      const topTriggered = topTriggeredQuery.rows.map(row => ({
        ruleId: row.rule_id,
        ruleName: row.rule_name,
        triggerCount: parseInt(row.trigger_count, 10) || 0
      }));

      const stats = {
        total: parseInt(totalActiveQuery.rows[0].total, 10) || 0,
        active: parseInt(totalActiveQuery.rows[0].active, 10) || 0,
        bySeverity,
        byMitreTactic,
        topTriggered
      };

      await setJSON(cacheKey, stats, 300);

      return stats;
    } catch (err) {
      log.error('RulesService.getRuleStats failed', {
        error: err.message,
        stack: err.stack
      });
      throw err;
    }
  }
}

module.exports = { rulesService: new RulesService() };
