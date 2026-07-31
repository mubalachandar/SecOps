const { query } = require('../config/database');
const { getJSON, setJSON } = require('../config/redis');
const logger = require('../utils/logger');
const { detectionEngine } = require('./detectionEngine');

const engine = detectionEngine || require('./detectionEngine');
const log = logger || require('../utils/logger');

class AnalyticsService {
  async getDashboardStats() {
    try {
      const cacheKey = 'analytics:dashboard';
      const cached = await getJSON(cacheKey);
      if (cached) return cached;

      const [overviewRes, eventsRes, activeRulesRes, mttrRes] = await Promise.all([
        query(`
          SELECT
            COUNT(*) as total_alerts,
            COUNT(*) FILTER (WHERE status = 'open') as open_alerts,
            COUNT(*) FILTER (WHERE severity = 'critical') as critical_alerts,
            COUNT(*) FILTER (
              WHERE status = 'resolved'
              AND resolved_at >= NOW() - INTERVAL '24 hours'
            ) as resolved_today
          FROM alerts
        `),
        query(`
          SELECT COUNT(*) as events_24h
          FROM cloudtrail_events
          WHERE processed_at >= NOW() - INTERVAL '24 hours'
        `),
        query(`
          SELECT COUNT(*) as active_rules
          FROM detection_rules
          WHERE is_active = true
        `),
        query(`
          SELECT
            AVG(
              EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60
            ) as mttr_minutes
          FROM alerts
          WHERE status = 'resolved'
          AND resolved_at IS NOT NULL
        `)
      ]);

      const overviewRow = overviewRes.rows[0];
      const eventsRow = eventsRes.rows[0];
      const rulesRow = activeRulesRes.rows[0];
      const mttrRow = mttrRes.rows[0];

      const result = {
        overview: {
          totalAlerts: parseInt(overviewRow.total_alerts, 10) || 0,
          openAlerts: parseInt(overviewRow.open_alerts, 10) || 0,
          criticalAlerts: parseInt(overviewRow.critical_alerts, 10) || 0,
          resolvedToday: parseInt(overviewRow.resolved_today, 10) || 0,
          eventsProcessed24h: parseInt(eventsRow.events_24h, 10) || 0,
          activeRules: parseInt(rulesRow.active_rules, 10) || 0,
          mttrMinutes: mttrRow.mttr_minutes ? parseFloat(parseFloat(mttrRow.mttr_minutes).toFixed(1)) : 0
        },
        generatedAt: new Date().toISOString()
      };

      await setJSON(cacheKey, result, 60);
      return result;
    } catch (err) {
      log.error('AnalyticsService.getDashboardStats failed', { error: err.message });
      throw err;
    }
  }

  async getAlertTrend(days = 30) {
    try {
      const cacheKey = `analytics:trend:${days}`;
      const cached = await getJSON(cacheKey);
      if (cached) return cached;

      const result = await query(`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE severity = 'critical') as critical,
          COUNT(*) FILTER (WHERE severity = 'high') as high,
          COUNT(*) FILTER (WHERE severity = 'medium') as medium,
          COUNT(*) FILTER (WHERE severity = 'low') as low
        FROM alerts
        WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [days]);

      const trend = result.rows.map(row => {
        const dateStr = new Date(row.date).toISOString().split('T')[0];
        return {
          date: dateStr,
          total: parseInt(row.total, 10) || 0,
          critical: parseInt(row.critical, 10) || 0,
          high: parseInt(row.high, 10) || 0,
          medium: parseInt(row.medium, 10) || 0,
          low: parseInt(row.low, 10) || 0
        };
      });

      const response = { trend, periodDays: days };
      await setJSON(cacheKey, response, 300);
      return response;
    } catch (err) {
      log.error('AnalyticsService.getAlertTrend failed', { error: err.message });
      throw err;
    }
  }

  async getSeverityDistribution() {
    try {
      const cacheKey = 'analytics:severity';
      const cached = await getJSON(cacheKey);
      if (cached) return cached;

      const result = await query(`
        SELECT
          severity,
          COUNT(*) as count
        FROM alerts
        GROUP BY severity
        ORDER BY
          CASE severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
          END
      `);

      let total = 0;
      const distributionRaw = result.rows.map(row => {
        const count = parseInt(row.count, 10) || 0;
        total += count;
        return { severity: row.severity, count };
      });

      const distribution = distributionRaw.map(item => ({
        severity: item.severity,
        count: item.count,
        percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0"
      }));

      const response = { distribution, total };
      await setJSON(cacheKey, response, 120);
      return response;
    } catch (err) {
      log.error('AnalyticsService.getSeverityDistribution failed', { error: err.message });
      throw err;
    }
  }

  async getTopAttackVectors() {
    try {
      const cacheKey = 'analytics:attack_vectors';
      const cached = await getJSON(cacheKey);
      if (cached) return cached;

      const result = await query(`
        SELECT
          mitre_tactic,
          COUNT(*) as alert_count,
          COUNT(*) FILTER (
            WHERE severity IN ('critical','high')
          ) as high_severity_count
        FROM alerts
        WHERE mitre_tactic IS NOT NULL
        GROUP BY mitre_tactic
        ORDER BY alert_count DESC
        LIMIT 10
      `);

      const attackVectors = result.rows.map(row => ({
        mitreTactic: row.mitre_tactic,
        alertCount: parseInt(row.alert_count, 10) || 0,
        highSeverityCount: parseInt(row.high_severity_count, 10) || 0
      }));

      const response = { attackVectors };
      await setJSON(cacheKey, response, 300);
      return response;
    } catch (err) {
      log.error('AnalyticsService.getTopAttackVectors failed', { error: err.message });
      throw err;
    }
  }

  async getGeographicDistribution() {
    try {
      const cacheKey = 'analytics:geo';
      const cached = await getJSON(cacheKey);
      if (cached) return cached;

      const result = await query(`
        SELECT
          aws_region,
          COUNT(*) as event_count
        FROM cloudtrail_events
        WHERE aws_region IS NOT NULL
        GROUP BY aws_region
        ORDER BY event_count DESC
      `);

      const regions = result.rows.map(row => ({
        region: row.aws_region,
        eventCount: parseInt(row.event_count, 10) || 0
      }));

      const response = { regions };
      await setJSON(cacheKey, response, 300);
      return response;
    } catch (err) {
      log.error('AnalyticsService.getGeographicDistribution failed', { error: err.message });
      throw err;
    }
  }

  async getTopSourceIPs(limit = 10) {
    try {
      const cacheKey = 'analytics:top_ips';
      const cached = await getJSON(cacheKey);
      if (cached) return cached;

      const result = await query(`
        SELECT
          source_ip,
          COUNT(*) as alert_count,
          MAX(created_at) as last_seen,
          array_agg(DISTINCT severity) as severities
        FROM alerts
        WHERE source_ip IS NOT NULL
        GROUP BY source_ip
        ORDER BY alert_count DESC
        LIMIT $1
      `, [limit]);

      const topIPs = result.rows.map(row => {
        const alertCount = parseInt(row.alert_count, 10) || 0;
        let severities = row.severities || [];
        if (typeof severities === 'string') {
          severities = severities.replace(/^{|}$/g, '').split(',').filter(Boolean);
        }
        const flagged = alertCount >= 3 || severities.includes('critical');
        
        return {
          sourceIp: row.source_ip,
          alertCount,
          lastSeen: new Date(row.last_seen).toISOString(),
          severities,
          flagged
        };
      });

      const response = { topIPs };
      await setJSON(cacheKey, response, 120);
      return response;
    } catch (err) {
      log.error('AnalyticsService.getTopSourceIPs failed', { error: err.message });
      throw err;
    }
  }

  async getSystemHealth() {
    try {
      const dbPromise = query('SELECT 1 as ok').then(() => ({ service: 'database', status: 'operational' }));

      const enginePromise = (async () => {
        if (engine && typeof engine.getEngineStats === 'function') {
          const stats = await engine.getEngineStats();
          if (stats && stats.activeRules > 0) {
            return { service: 'detectionEngine', status: 'operational', activeRules: stats.activeRules };
          }
        }
        return { service: 'detectionEngine', status: 'degraded' };
      })();

      const aiPromise = query(`
        SELECT COUNT(*) as count 
        FROM alert_analyses 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
      `).then(res => {
        if (parseInt(res.rows[0].count, 10) >= 0) {
          return { service: 'aiAnalysis', status: 'operational' };
        }
        return { service: 'aiAnalysis', status: 'degraded' };
      });

      const results = await Promise.allSettled([dbPromise, enginePromise, aiPromise]);

      const health = [
        results[0].status === 'fulfilled' ? results[0].value : { service: 'database', status: 'degraded' },
        results[1].status === 'fulfilled' ? results[1].value : { service: 'detectionEngine', status: 'degraded' },
        results[2].status === 'fulfilled' ? results[2].value : { service: 'aiAnalysis', status: 'degraded' }
      ];

      return {
        health,
        checkedAt: new Date().toISOString()
      };
    } catch (err) {
      log.error('AnalyticsService.getSystemHealth failed', { error: err.message });
      throw err;
    }
  }

  async getMTTR(days = 30) {
    try {
      const cacheKey = `analytics:mttr:${days}`;
      const cached = await getJSON(cacheKey);
      if (cached) return cached;

      const result = await query(`
        SELECT
          AVG(
            EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60
          ) as avg_minutes,
          MIN(
            EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60
          ) as min_minutes,
          MAX(
            EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60
          ) as max_minutes,
          COUNT(*) as sample_size
        FROM alerts
        WHERE status = 'resolved'
        AND resolved_at IS NOT NULL
        AND created_at >= NOW() - ($1::int * INTERVAL '1 day')
      `, [days]);

      const row = result.rows[0];

      const response = {
        mttr: {
          avgMinutes: row.avg_minutes ? parseFloat(parseFloat(row.avg_minutes).toFixed(1)) : 0,
          minMinutes: row.min_minutes ? parseFloat(parseFloat(row.min_minutes).toFixed(1)) : 0,
          maxMinutes: row.max_minutes ? parseFloat(parseFloat(row.max_minutes).toFixed(1)) : 0,
          sampleSize: parseInt(row.sample_size, 10) || 0,
          periodDays: days
        }
      };

      await setJSON(cacheKey, response, 300);
      return response;
    } catch (err) {
      log.error('AnalyticsService.getMTTR failed', { error: err.message });
      throw err;
    }
  }
  async getRiskScoreTimeline() {
    try {
      const cacheKey = 'analytics:risk_timeline';
      const cached = await getJSON(cacheKey);
      if (cached) return cached;

      const result = await query(`
        SELECT
          DATE(a.created_at) as date,
          ROUND(AVG(aa.risk_score)::numeric, 1) as avg_risk,
          MAX(aa.risk_score) as max_risk,
          COUNT(aa.id) as analyzed_count
        FROM alerts a
        JOIN alert_analyses aa ON aa.alert_id = a.id
        WHERE a.created_at >= NOW() - INTERVAL '14 days'
        GROUP BY DATE(a.created_at)
        ORDER BY date ASC
      `);

      const timeline = result.rows.map(row => ({
        date: new Date(row.date).toISOString().split('T')[0],
        avgRisk: parseFloat(row.avg_risk) || 0,
        maxRisk: parseInt(row.max_risk, 10) || 0,
        analyzedCount: parseInt(row.analyzed_count, 10) || 0
      }));

      await setJSON(cacheKey, timeline, 300);
      return timeline;
    } catch (err) {
      log.error('AnalyticsService.getRiskScoreTimeline failed', { error: err.message });
      throw err;
    }
  }

  async getIncidentBurndown() {
    try {
      const cacheKey = 'analytics:incident_burndown';
      const cached = await getJSON(cacheKey);
      if (cached) return cached;

      const result = await query(`
        SELECT
          d.date,
          COALESCE(c.created_count, 0) as created,
          COALESCE(r.resolved_count, 0) as resolved
        FROM (
          SELECT generate_series(
            (NOW() - INTERVAL '14 days')::date,
            NOW()::date,
            '1 day'::interval
          )::date as date
        ) d
        LEFT JOIN (
          SELECT DATE(created_at) as date, COUNT(*) as created_count
          FROM alerts
          WHERE created_at >= NOW() - INTERVAL '14 days'
          GROUP BY DATE(created_at)
        ) c ON c.date = d.date
        LEFT JOIN (
          SELECT DATE(resolved_at) as date, COUNT(*) as resolved_count
          FROM alerts
          WHERE resolved_at IS NOT NULL
          AND resolved_at >= NOW() - INTERVAL '14 days'
          GROUP BY DATE(resolved_at)
        ) r ON r.date = d.date
        ORDER BY d.date ASC
      `);

      const burndown = result.rows.map(row => ({
        date: new Date(row.date).toISOString().split('T')[0],
        created: parseInt(row.created, 10) || 0,
        resolved: parseInt(row.resolved, 10) || 0,
        netNew: (parseInt(row.created, 10) || 0) - (parseInt(row.resolved, 10) || 0)
      }));

      await setJSON(cacheKey, burndown, 300);
      return burndown;
    } catch (err) {
      log.error('AnalyticsService.getIncidentBurndown failed', { error: err.message });
      throw err;
    }
  }
}

module.exports = { analyticsService: new AnalyticsService() };
