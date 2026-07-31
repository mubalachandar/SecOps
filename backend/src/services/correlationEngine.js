const { query } = require('../config/database');
const logger = require('../utils/logger');

class CorrelationEngine {
  constructor() {
    this.CORRELATION_RULES = [
      {
        name: 'same_source_ip',
        description: 'Multiple alerts from same source IP within 30 minutes',
        correlationFn: (alerts) => {
          const groups = {};
          alerts.forEach(alert => {
            if (alert.source_ip) {
              if (!groups[alert.source_ip]) groups[alert.source_ip] = [];
              groups[alert.source_ip].push(alert);
            }
          });
          return Object.values(groups).filter(group => {
            if (group.length < 2) return false;
            const sorted = group.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const timeDiff = (new Date(sorted[sorted.length - 1].created_at) - new Date(sorted[0].created_at)) / (1000 * 60);
            return timeDiff <= 30;
          });
        },
        severity: (alerts) => this.escalateSeverity(this.getHighestSeverity(alerts)),
        killChainPhase: 'active_attack',
        attackPattern: 'multi_vector_from_single_source'
      },
      {
        name: 'privilege_escalation_chain',
        description: 'Sequence of IAM and authentication alerts indicating privilege escalation',
        correlationFn: (alerts) => {
          const relevant = alerts.filter(a => ['TA0003', 'TA0004'].includes(a.mitre_tactic));
          if (relevant.length >= 2) {
            const sorted = relevant.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const timeDiff = (new Date(sorted[sorted.length - 1].created_at) - new Date(sorted[0].created_at)) / (1000 * 60);
            if (timeDiff <= 60) return [relevant];
          }
          return [];
        },
        severity: () => 'high', // always high or critical (let's default to high, createIncident maxes it with existing alerts)
        killChainPhase: 'escalation',
        attackPattern: 'privilege_escalation_sequence'
      },
      {
        name: 'defense_evasion_precursor',
        description: 'Defense evasion alerts followed by other attack tactics',
        correlationFn: (alerts) => {
          const sorted = [...alerts].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          const groups = [];
          for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].mitre_tactic === 'TA0005') {
              const evasionTime = new Date(sorted[i].created_at);
              const group = [sorted[i]];
              for (let j = i + 1; j < sorted.length; j++) {
                if (sorted[j].mitre_tactic && sorted[j].mitre_tactic !== 'TA0005') {
                  const followTime = new Date(sorted[j].created_at);
                  if ((followTime - evasionTime) / (1000 * 60) <= 20) {
                    group.push(sorted[j]);
                  }
                }
              }
              if (group.length > 1) groups.push(group);
            }
          }
          return groups;
        },
        severity: () => 'critical',
        killChainPhase: 'evasion_then_action',
        attackPattern: 'defense_evasion_precursor'
      },
      {
        name: 'data_exfiltration_pattern',
        description: 'S3 or data access alerts combined with exfiltration indicators',
        correlationFn: (alerts) => {
          const sorted = [...alerts].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          let hasTA0009 = false;
          let hasTA0010 = false;
          const group = [];
          for (const alert of sorted) {
            if (alert.mitre_tactic === 'TA0009') { hasTA0009 = true; group.push(alert); }
            else if (alert.mitre_tactic === 'TA0010') { hasTA0010 = true; group.push(alert); }
            else if (hasTA0009 || hasTA0010) { group.push(alert); } // Optional: include middle alerts? We'll just grab the critical ones.
          }
          if (hasTA0009 && hasTA0010) {
            const relevant = group.filter(a => ['TA0009', 'TA0010'].includes(a.mitre_tactic));
            const timeDiff = (new Date(relevant[relevant.length - 1].created_at) - new Date(relevant[0].created_at)) / (1000 * 60);
            if (timeDiff <= 45) return [relevant];
          }
          return [];
        },
        severity: () => 'critical',
        killChainPhase: 'exfiltration',
        attackPattern: 'data_exfiltration_campaign'
      },
      {
        name: 'credential_to_lateral',
        description: 'Credential access alerts followed by lateral movement',
        correlationFn: (alerts) => {
          const sorted = [...alerts].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          const groups = [];
          for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].mitre_tactic === 'TA0006') {
              const credTime = new Date(sorted[i].created_at);
              const group = [sorted[i]];
              for (let j = i + 1; j < sorted.length; j++) {
                if (sorted[j].mitre_tactic === 'TA0008') {
                  const latTime = new Date(sorted[j].created_at);
                  if ((latTime - credTime) / (1000 * 60) <= 30) {
                    group.push(sorted[j]);
                  }
                }
              }
              if (group.length > 1) groups.push(group);
            }
          }
          return groups;
        },
        severity: () => 'critical',
        killChainPhase: 'post_compromise',
        attackPattern: 'credential_harvesting_to_movement'
      },
      {
        name: 'same_resource_targeted',
        description: 'Multiple alerts targeting the same AWS resource',
        correlationFn: (alerts) => {
          const groups = {};
          alerts.forEach(alert => {
            const rawEvent = alert.raw_event || {};
            // Attempt to extract resource identifier
            const resources = [];
            if (rawEvent.resources && Array.isArray(rawEvent.resources)) {
              rawEvent.resources.forEach(r => resources.push(r.ARN || r.arn || r.name || r.id));
            }
            if (resources.length === 0 && rawEvent.requestParameters && rawEvent.requestParameters.bucketName) {
              resources.push(rawEvent.requestParameters.bucketName);
            }
            if (resources.length === 0 && rawEvent.requestParameters && rawEvent.requestParameters.instancesSet) {
              resources.push('EC2_Instances');
            }
            
            resources.forEach(res => {
              if (res) {
                if (!groups[res]) groups[res] = [];
                groups[res].push(alert);
              }
            });
          });
          return Object.values(groups).filter(group => {
            if (group.length < 3) return false;
            const sorted = group.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const timeDiff = (new Date(sorted[sorted.length - 1].created_at) - new Date(sorted[0].created_at)) / (1000 * 60);
            return timeDiff <= 60;
          });
        },
        severity: (alerts) => this.getHighestSeverity(alerts),
        killChainPhase: 'targeted_attack',
        attackPattern: 'resource_targeted_campaign'
      }
    ];

    this.severityWeight = { 'info': 1, 'low': 2, 'medium': 3, 'high': 4, 'critical': 5 };

    // Start background correlation job (every 5 minutes)
    this.intervalRef = setInterval(() => {
      this.correlateAlerts().catch(err => {
        logger.error('Background correlation failed', { error: err.message });
      });
    }, 5 * 60 * 1000);
  }

  getHighestSeverity(alerts) {
    let max = 'info';
    for (const a of alerts) {
      if (this.severityWeight[a.severity] > this.severityWeight[max]) {
        max = a.severity;
      }
    }
    return max;
  }

  escalateSeverity(severity) {
    if (severity === 'info') return 'low';
    if (severity === 'low') return 'medium';
    if (severity === 'medium') return 'high';
    return 'critical';
  }

  async correlateAlerts() {
    try {
      // Fetch open alerts from the last 2 hours
      const result = await query(`
        SELECT * FROM alerts 
        WHERE status IN ('open', 'investigating') 
        AND created_at >= NOW() - INTERVAL '2 hours' 
        ORDER BY created_at ASC
      `);
      
      const alerts = result.rows;
      if (!alerts || alerts.length === 0) {
        return { incidentsCreated: 0, incidentsUpdated: 0, alertsCorrelated: 0 };
      }

      let incidentsCreated = 0;
      let incidentsUpdated = 0;
      let alertsCorrelated = 0;

      for (const rule of this.CORRELATION_RULES) {
        const groups = rule.correlationFn(alerts);
        
        for (const group of groups) {
          if (group.length >= 2) {
            const alertIds = group.map(a => a.id);
            const existingIncident = await this.findExistingIncident(alertIds);
            
            if (existingIncident) {
              await this.updateIncident(existingIncident.id, group, rule);
              incidentsUpdated++;
              alertsCorrelated += group.length;
            } else {
              await this.createIncident(group, rule);
              incidentsCreated++;
              alertsCorrelated += group.length;
            }
          }
        }
      }

      return { incidentsCreated, incidentsUpdated, alertsCorrelated };
    } catch (error) {
      logger.error('Correlation engine failed', { error: error.message });
      throw error;
    }
  }

  async findExistingIncident(alertIds) {
    if (!alertIds || alertIds.length === 0) return null;
    
    // Find if any of these alerts already belong to an active incident
    const result = await query(`
      SELECT i.* 
      FROM incidents i
      JOIN incident_alerts ia ON i.id = ia.incident_id
      WHERE ia.alert_id = ANY($1) AND i.status != 'resolved'
      LIMIT 1
    `, [alertIds]);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async createIncident(alerts, rule) {
    const incidentId = 'INC-' + Date.now().toString(36).toUpperCase();
    
    // Extract unique properties
    const sourceIps = [...new Set(alerts.map(a => a.source_ip).filter(Boolean))];
    const tactics = [...new Set(alerts.map(a => a.mitre_tactic).filter(Boolean))];
    const techniques = [...new Set(alerts.map(a => a.mitre_technique).filter(Boolean))];
    
    // Extract affected resources (basic extraction)
    const affectedResources = new Set();
    alerts.forEach(alert => {
      if (alert.raw_event?.resources) {
        alert.raw_event.resources.forEach(r => affectedResources.add(r.ARN || r.name));
      }
      if (alert.raw_event?.userIdentity?.userName) {
        affectedResources.add(alert.raw_event.userIdentity.userName);
      }
    });

    const sortedAlerts = [...alerts].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const firstSeen = sortedAlerts[0].created_at;
    const lastSeen = sortedAlerts[sortedAlerts.length - 1].created_at;

    let criticalCount = 0;
    let highCount = 0;
    let maxAlertSev = 'info';

    alerts.forEach(a => {
      if (a.severity === 'critical') criticalCount++;
      if (a.severity === 'high') highCount++;
      if (this.severityWeight[a.severity] > this.severityWeight[maxAlertSev]) {
        maxAlertSev = a.severity;
      }
    });

    // Rule can specify a severity calculation or static severity
    let finalSeverity = 'critical';
    if (typeof rule.severity === 'function') {
      finalSeverity = rule.severity(alerts);
    } else {
      finalSeverity = rule.severity;
    }

    // Critical always wins
    if (maxAlertSev === 'critical' || criticalCount > 0) {
      finalSeverity = 'critical';
    }

    const baseRisk = 50;
    let riskScore = baseRisk + (criticalCount * 20) + (highCount * 10) + (alerts.length * 5);
    if (riskScore > 100) riskScore = 100;

    const title = `${rule.attackPattern.replace(/_/g, ' ').toUpperCase()}: ${alerts.length} correlated alerts`;
    const description = `Auto-generated incident based on rule: ${rule.description}. Detected ${alerts.length} alerts indicating ${rule.attackPattern}.`;

    // Insert Incident
    const insertRes = await query(`
      INSERT INTO incidents (
        incident_id, title, description, severity, status, risk_score, alert_count, 
        affected_resources, source_ips, mitre_tactics, mitre_techniques, attack_pattern, 
        kill_chain_phase, first_seen, last_seen
      ) VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      incidentId, title, description, finalSeverity, riskScore, alerts.length,
      JSON.stringify([...affectedResources]), JSON.stringify(sourceIps), JSON.stringify(tactics),
      JSON.stringify(techniques), rule.attackPattern, rule.killChainPhase, firstSeen, lastSeen
    ]);

    const createdIncident = insertRes.rows[0];
    const id = createdIncident.id;

    // Insert incident_alerts relationships
    for (const alert of alerts) {
      await query(`
        INSERT INTO incident_alerts (incident_id, alert_id, correlation_reason)
        VALUES ($1, $2, $3)
        ON CONFLICT (incident_id, alert_id) DO NOTHING
      `, [id, alert.id, rule.description]);
    }

    logger.warn('New incident created', { incidentId, title, alertCount: alerts.length, severity: finalSeverity });
    
    setImmediate(() => {
      try {
        const { notificationService } = require('./notificationService');
        notificationService.notifyNewIncident(createdIncident).catch(err => 
          logger.error('Incident notification failed', { error: err.message, incidentId: id })
        );
      } catch (e) {
        logger.error('Failed to trigger notification service', { error: e.message });
      }
    });
    
    return { id, incident_id: incidentId };
  }

  async updateIncident(incidentId, newAlerts, rule) {
    // 1. Insert new alerts
    for (const alert of newAlerts) {
      await query(`
        INSERT INTO incident_alerts (incident_id, alert_id, correlation_reason)
        VALUES ($1, $2, $3)
        ON CONFLICT (incident_id, alert_id) DO NOTHING
      `, [incidentId, alert.id, rule.description]);
    }

    // 2. Fetch all current alerts for this incident
    const allAlertsRes = await query(`
      SELECT a.* 
      FROM alerts a
      JOIN incident_alerts ia ON a.id = ia.alert_id
      WHERE ia.incident_id = $1
    `, [incidentId]);
    
    const allAlerts = allAlertsRes.rows;
    
    // 3. Recalculate stats
    const sourceIps = [...new Set(allAlerts.map(a => a.source_ip).filter(Boolean))];
    const tactics = [...new Set(allAlerts.map(a => a.mitre_tactic).filter(Boolean))];
    const techniques = [...new Set(allAlerts.map(a => a.mitre_technique).filter(Boolean))];
    
    const sortedAlerts = [...allAlerts].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const firstSeen = sortedAlerts[0].created_at;
    const lastSeen = sortedAlerts[sortedAlerts.length - 1].created_at;

    let criticalCount = 0;
    let highCount = 0;
    let maxAlertSev = 'info';

    allAlerts.forEach(a => {
      if (a.severity === 'critical') criticalCount++;
      if (a.severity === 'high') highCount++;
      if (this.severityWeight[a.severity] > this.severityWeight[maxAlertSev]) {
        maxAlertSev = a.severity;
      }
    });

    let finalSeverity = rule.severity;
    if (typeof rule.severity === 'function') {
      finalSeverity = rule.severity(allAlerts);
    }
    if (maxAlertSev === 'critical' || criticalCount > 0) {
      finalSeverity = 'critical';
    }

    const baseRisk = 50;
    let riskScore = baseRisk + (criticalCount * 20) + (highCount * 10) + (allAlerts.length * 5);
    if (riskScore > 100) riskScore = 100;

    const result = await query(`
      UPDATE incidents 
      SET 
        alert_count = $1, 
        severity = $2, 
        risk_score = $3, 
        last_seen = $4, 
        mitre_tactics = $5, 
        mitre_techniques = $6, 
        source_ips = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [allAlerts.length, finalSeverity, riskScore, lastSeen, JSON.stringify(tactics), JSON.stringify(techniques), JSON.stringify(sourceIps), incidentId]);

    return result.rows[0];
  }

  async getIncidents(filters = {}, pagination = {}) {
    const values = [];
    const where = [];
    
    if (filters.status) {
      values.push(filters.status);
      where.push(`status = $${values.length}`);
    }
    if (filters.severity) {
      values.push(filters.severity);
      where.push(`severity = $${values.length}`);
    }
    if (filters.attack_pattern) {
      values.push(filters.attack_pattern);
      where.push(`attack_pattern = $${values.length}`);
    }

    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 12));
    
    const condition = where.length ? `WHERE ${where.join(' AND ')}` : '';
    
    const countRes = await query(`SELECT COUNT(*)::int as total FROM incidents ${condition}`, values);
    const total = countRes.rows[0].total;
    
    values.push(limit, (page - 1) * limit);
    const result = await query(`
      SELECT * FROM incidents 
      ${condition} 
      ORDER BY updated_at DESC 
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `, values);
    
    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getIncidentById(incidentId) {
    const result = await query(`SELECT * FROM incidents WHERE incident_id = $1 OR id::text = $1`, [incidentId]);
    if (result.rows.length === 0) return null;
    const incident = result.rows[0];
    
    const alertsRes = await query(`
      SELECT a.* 
      FROM alerts a
      JOIN incident_alerts ia ON a.id = ia.alert_id
      WHERE ia.incident_id = $1
      ORDER BY a.created_at DESC
    `, [incident.id]);
    
    return {
      incident,
      alerts: alertsRes.rows,
      timeline: this.buildTimeline(alertsRes.rows)
    };
  }
  
  buildTimeline(alerts) {
    const sorted = [...alerts].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return sorted.map(a => ({
      timestamp: a.created_at,
      event: a.title,
      alertId: a.alert_id,
      severity: a.severity,
      description: a.description
    }));
  }

  async getIncidentStats() {
    const result = await query(`
      SELECT 
        (SELECT COUNT(*)::int FROM incidents) as total_incidents,
        (SELECT COUNT(*)::int FROM incidents WHERE status = 'active') as active_incidents,
        (SELECT COUNT(*)::int FROM incidents WHERE status = 'resolved') as resolved_incidents,
        (SELECT COUNT(*)::int FROM incidents WHERE severity = 'critical') as critical_incidents,
        (SELECT ROUND(AVG(risk_score))::int FROM incidents WHERE status = 'active') as avg_risk_score,
        COALESCE((SELECT jsonb_object_agg(severity, count) FROM (SELECT severity, COUNT(*)::int as count FROM incidents GROUP BY severity) s), '{}'::jsonb) as by_severity
    `);
    
    return result.rows[0];
  }

  async resolveIncident(incidentId, resolvedBy) {
    const result = await query(`
      UPDATE incidents 
      SET status = 'resolved', resolved_at = NOW(), updated_at = NOW() 
      WHERE incident_id = $1 OR id::text = $1
      RETURNING *
    `, [incidentId]);
    return result.rows[0];
  }
}

module.exports = { correlationEngine: new CorrelationEngine(), CorrelationEngine };
