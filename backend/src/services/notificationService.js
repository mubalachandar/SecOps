const { IncomingWebhook } = require('@slack/webhook');
const sgMail = require('@sendgrid/mail');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const { format } = require('date-fns');

class NotificationService {
  constructor() {
    this.slackWebhook = process.env.SLACK_WEBHOOK_URL ? new IncomingWebhook(process.env.SLACK_WEBHOOK_URL) : null;
    
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
    
    this.slackEnabled = !!process.env.SLACK_WEBHOOK_URL;
    this.emailEnabled = !!process.env.SENDGRID_API_KEY;
    
    logger.info('NotificationService initialized', {
      slackEnabled: this.slackEnabled,
      emailEnabled: this.emailEnabled
    });
  }

  buildSlackAlertMessage(alert) {
    const emojis = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵'
    };
    
    const emoji = emojis[alert.severity?.toLowerCase()] || '🔵';

    return {
      text: `🚨 New Security Alert: ${alert.title}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${emoji} ${alert.severity?.toUpperCase() || 'UNKNOWN'} ALERT DETECTED`,
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Alert:*\n${alert.title}` },
            { type: "mrkdwn", text: `*Severity:*\n${alert.severity}` },
            { type: "mrkdwn", text: `*Status:*\n${alert.status}` },
            { type: "mrkdwn", text: `*MITRE Tactic:*\n${alert.mitre_tactic || 'N/A'}` },
            { type: "mrkdwn", text: `*Source IP:*\n${alert.source_ip || 'N/A'}` },
            { type: "mrkdwn", text: `*Resource:*\n${alert.affected_resource || 'N/A'}` },
            { type: "mrkdwn", text: `*Time:*\n${format(new Date(alert.created_at || new Date()), 'PPpp')}` },
            { type: "mrkdwn", text: `*MITRE Technique:*\n${alert.mitre_technique || 'N/A'}` }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Description:*\n${alert.description || 'No description available'}`
          }
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "🔍 Investigate Alert", emoji: true },
              style: "danger",
              url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/alerts`
            },
            {
              type: "button",
              text: { type: "plain_text", text: "📊 View Dashboard", emoji: true },
              url: process.env.FRONTEND_URL || 'http://localhost:5173'
            }
          ]
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `SecOps AI Copilot • Alert ID: ${alert.alert_id || alert.id} • ${format(new Date(), 'PPpp')}`
            }
          ]
        }
      ]
    };
  }

  buildSlackIncidentMessage(incident) {
    const colors = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#eab308',
      low: '#3b82f6'
    };
    
    return {
      text: `⚡ Security Incident Detected: ${incident.title}`,
      attachments: [
        {
          color: colors[incident.severity?.toLowerCase()] || '#3b82f6',
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `⚡ SECURITY INCIDENT DETECTED`,
                emoji: true
              }
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Incident ID:*\n${incident.incident_id || incident.id}` },
                { type: "mrkdwn", text: `*Title:*\n${incident.title}` },
                { type: "mrkdwn", text: `*Severity:*\n${incident.severity}` },
                { type: "mrkdwn", text: `*Risk Score:*\n${incident.risk_score}/100` },
                { type: "mrkdwn", text: `*Alert Count:*\n${incident.alert_count}` },
                { type: "mrkdwn", text: `*Attack Pattern:*\n${incident.attack_pattern || 'N/A'}` },
                { type: "mrkdwn", text: `*Kill Chain Phase:*\n${incident.kill_chain_phase || 'N/A'}` },
                { type: "mrkdwn", text: `*First Seen:*\n${format(new Date(incident.first_seen || new Date()), 'PPpp')}` }
              ]
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Affected Resources:*\n${incident.affected_resources?.length || 0} resources affected`
              }
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: { type: "plain_text", text: "🔍 View Incident", emoji: true },
                  style: "danger",
                  url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/incidents`
                }
              ]
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `SecOps AI Copilot • ${format(new Date(), 'PPpp')}`
                }
              ]
            }
          ]
        }
      ]
    };
  }

  buildEmailAlertHTML(alert) {
    const colors = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#eab308',
      low: '#3b82f6'
    };
    const color = colors[alert.severity?.toLowerCase()] || '#3b82f6';
    const timestamp = format(new Date(alert.created_at || new Date()), 'PPpp');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { background: #0f172a; font-family: Arial, sans-serif; color: #f1f5f9; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 8px; overflow: hidden; }
    .header { background-color: ${color}; padding: 24px; text-align: center; }
    .severity-badge { display: inline-block; background: rgba(0,0,0,0.3); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; letter-spacing: 1px; }
    .title { color: white; font-size: 22px; font-weight: bold; margin: 8px 0; }
    .content { padding: 24px; }
    .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
    .metric-card { background: #0f172a; border-radius: 6px; padding: 12px; }
    .metric-label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .metric-value { color: #f1f5f9; font-size: 16px; font-weight: bold; margin-top: 4px; }
    .mitre-badge { display: inline-block; background: rgba(59,130,246,0.2); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3); border-radius: 4px; padding: 4px 8px; font-size: 12px; font-family: monospace; }
    .cta-button { display: block; background: #3b82f6; color: white; text-align: center; padding: 14px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { background: #0f172a; padding: 16px 24px; text-align: center; color: #475569; font-size: 12px; }
    .description-box { background: #0f172a; border-left: 4px solid ${color}; padding: 12px 16px; margin: 16px 0; border-radius: 0 6px 6px 0; color: #94a3b8; font-size: 14px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="severity-badge">${alert.severity?.toUpperCase() || 'UNKNOWN'} SEVERITY</div>
      <div class="title">SECURITY ALERT</div>
      <div style="color: rgba(255,255,255,0.9); font-size: 16px;">${alert.title}</div>
    </div>
    <div class="content">
      <div class="metric-grid">
        <div class="metric-card"><div class="metric-label">Severity</div><div class="metric-value">${alert.severity}</div></div>
        <div class="metric-card"><div class="metric-label">Status</div><div class="metric-value">${alert.status}</div></div>
        <div class="metric-card"><div class="metric-label">MITRE Tactic</div><div class="metric-value">${alert.mitre_tactic || 'N/A'}</div></div>
        <div class="metric-card"><div class="metric-label">MITRE Technique</div><div class="metric-value">${alert.mitre_technique || 'N/A'}</div></div>
        <div class="metric-card"><div class="metric-label">Source IP</div><div class="metric-value">${alert.source_ip || 'N/A'}</div></div>
        <div class="metric-card"><div class="metric-label">Affected Resource</div><div class="metric-value">${alert.affected_resource || 'N/A'}</div></div>
      </div>
      
      <div class="description-box">
        <strong>Description:</strong><br/>
        ${alert.description || 'No description available'}
      </div>
      
      ${alert.mitre_tactic ? `<div class="mitre-badge">${alert.mitre_tactic} &mdash; ${alert.mitre_technique || 'Unknown'}</div>` : ''}
      
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/alerts" class="cta-button">Investigate This Alert &rarr;</a>
      
      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #334155;">
        <h3 style="color: #94a3b8; font-size: 14px; margin-bottom: 12px; text-transform: uppercase;">Raw Event Summary</h3>
        <pre style="background: #0f172a; padding: 12px; border-radius: 4px; color: #a5b4fc; font-size: 12px; overflow-x: auto;">
${JSON.stringify(alert.raw_event || {}, null, 2).substring(0, 500)}${alert.raw_event ? '...' : 'No raw event data'}
        </pre>
      </div>
    </div>
    <div class="footer">
      SecOps AI Copilot &bull; Alert ID: ${alert.alert_id || alert.id} &bull; Generated: ${timestamp}<br/><br/>
      You are receiving this because you are configured as a SOC analyst.
    </div>
  </div>
</body>
</html>
    `;
  }

  buildEmailAlertText(alert) {
    const timestamp = format(new Date(alert.created_at || new Date()), 'PPpp');
    return `
SECURITY ALERT: ${alert.title}
Severity: ${alert.severity?.toUpperCase()}

Alert Details:
- Status: ${alert.status}
- MITRE Tactic: ${alert.mitre_tactic || 'N/A'}
- MITRE Technique: ${alert.mitre_technique || 'N/A'}
- Source IP: ${alert.source_ip || 'N/A'}
- Affected Resource: ${alert.affected_resource || 'N/A'}

Description:
${alert.description || 'No description available'}

Investigate: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/alerts

SecOps AI Copilot • Alert ID: ${alert.alert_id || alert.id} • Generated: ${timestamp}
    `.trim();
  }

  buildEmailIncidentHTML(incident) {
    const color = '#9333ea'; // Purple for incidents
    const timestamp = format(new Date(incident.created_at || new Date()), 'PPpp');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { background: #0f172a; font-family: Arial, sans-serif; color: #f1f5f9; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 8px; overflow: hidden; }
    .header { background-color: ${color}; padding: 24px; text-align: center; }
    .severity-badge { display: inline-block; background: rgba(0,0,0,0.3); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; letter-spacing: 1px; }
    .title { color: white; font-size: 22px; font-weight: bold; margin: 8px 0; }
    .content { padding: 24px; }
    .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
    .metric-card { background: #0f172a; border-radius: 6px; padding: 12px; }
    .metric-label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .metric-value { color: #f1f5f9; font-size: 16px; font-weight: bold; margin-top: 4px; }
    .cta-button { display: block; background: ${color}; color: white; text-align: center; padding: 14px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { background: #0f172a; padding: 16px 24px; text-align: center; color: #475569; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="severity-badge">INCIDENT DETECTED</div>
      <div class="title">SECURITY INCIDENT</div>
      <div style="color: rgba(255,255,255,0.9); font-size: 16px;">${incident.title}</div>
    </div>
    <div class="content">
      <div class="metric-grid">
        <div class="metric-card"><div class="metric-label">Severity</div><div class="metric-value">${incident.severity}</div></div>
        <div class="metric-card"><div class="metric-label">Risk Score</div><div class="metric-value">${incident.risk_score || 0}/100</div></div>
        <div class="metric-card"><div class="metric-label">Attack Pattern</div><div class="metric-value">${incident.attack_pattern || 'N/A'}</div></div>
        <div class="metric-card"><div class="metric-label">Kill Chain Phase</div><div class="metric-value">${incident.kill_chain_phase || 'N/A'}</div></div>
        <div class="metric-card"><div class="metric-label">Alert Count</div><div class="metric-value">${incident.alert_count || 0}</div></div>
        <div class="metric-card"><div class="metric-label">First Seen</div><div class="metric-value">${format(new Date(incident.first_seen || new Date()), 'MMM d, HH:mm')}</div></div>
      </div>
      
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/incidents" class="cta-button">View Security Incident &rarr;</a>
    </div>
    <div class="footer">
      SecOps AI Copilot &bull; Incident ID: ${incident.incident_id || incident.id} &bull; Generated: ${timestamp}<br/><br/>
      You are receiving this because you are configured as a SOC analyst.
    </div>
  </div>
</body>
</html>
    `;
  }

  async sendSlackAlert(alert) {
    if (!this.slackEnabled) {
      logger.warn('Slack notification skipped: Slack not configured');
      return { sent: false, reason: 'Slack not configured' };
    }

    try {
      const message = this.buildSlackAlertMessage(alert);
      await this.slackWebhook.send(message);
      
      logger.info('Slack alert sent', { alertId: alert.id, severity: alert.severity });
      
      await query(`
        INSERT INTO notification_logs (channel, recipient, subject, message_preview, status, alert_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'slack',
        process.env.SLACK_CHANNEL || 'webhook',
        alert.title,
        `[${alert.severity?.toUpperCase()}] ${alert.title}`.substring(0, 100),
        'sent',
        alert.id
      ]);
      
      return { sent: true, channel: 'slack' };
    } catch (err) {
      logger.error('Failed to send Slack alert', { error: err.message });
      
      await query(`
        INSERT INTO notification_logs (channel, recipient, subject, message_preview, status, error_message, alert_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'slack',
        process.env.SLACK_CHANNEL || 'webhook',
        alert.title || 'Unknown Alert',
        'Failed to send Slack message',
        'failed',
        err.message,
        alert.id
      ]).catch(e => logger.error('Failed to write notification log', { error: e.message }));
      
      return { sent: false, error: err.message };
    }
  }

  async sendSlackIncident(incident) {
    if (!this.slackEnabled) {
      return { sent: false, reason: 'Slack not configured' };
    }

    try {
      const message = this.buildSlackIncidentMessage(incident);
      await this.slackWebhook.send(message);
      
      await query(`
        INSERT INTO notification_logs (channel, recipient, subject, message_preview, status, incident_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'slack',
        process.env.SLACK_CHANNEL || 'webhook',
        incident.title,
        `[INCIDENT] ${incident.title}`.substring(0, 100),
        'sent',
        incident.id
      ]);
      
      return { sent: true, channel: 'slack' };
    } catch (err) {
      logger.error('Failed to send Slack incident', { error: err.message });
      return { sent: false, error: err.message };
    }
  }

  async sendEmailAlert(alert, recipients) {
    if (!this.emailEnabled) {
      return { sent: false, reason: 'Email not configured' };
    }

    let targetRecipients = recipients;
    if (!targetRecipients || targetRecipients.length === 0) {
      const envRecipients = process.env.NOTIFICATION_EMAIL_RECIPIENTS;
      if (envRecipients) {
        targetRecipients = envRecipients.split(',').map(e => e.trim()).filter(e => e);
      }
    }

    if (!targetRecipients || targetRecipients.length === 0) {
      return { sent: false, reason: 'No recipients configured' };
    }

    const emojis = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵' };
    const emoji = emojis[alert.severity?.toLowerCase()] || '🔵';

    try {
      const msg = {
        to: targetRecipients,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: process.env.SENDGRID_FROM_NAME || 'SecOps AI Copilot'
        },
        subject: `${emoji} [${alert.severity?.toUpperCase()}] Security Alert: ${alert.title}`,
        text: this.buildEmailAlertText(alert),
        html: this.buildEmailAlertHTML(alert),
        trackingSettings: {
          clickTracking: { enable: false },
          openTracking: { enable: false }
        }
      };

      await sgMail.send(msg);
      logger.info('Email alert sent', { alertId: alert.id, recipients: targetRecipients.length });
      
      // Log for each recipient
      for (const recipient of targetRecipients) {
        await query(`
          INSERT INTO notification_logs (channel, recipient, subject, message_preview, status, alert_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          'email',
          recipient,
          msg.subject,
          msg.text.substring(0, 100),
          'sent',
          alert.id
        ]);
      }
      
      return { sent: true, recipients: targetRecipients.length };
    } catch (err) {
      logger.error('Failed to send Email alert', { error: err.message });
      
      await query(`
        INSERT INTO notification_logs (channel, recipient, subject, message_preview, status, error_message, alert_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'email',
        targetRecipients.join(', '),
        alert.title || 'Unknown Alert',
        'Failed to send Email message',
        'failed',
        err.message,
        alert.id
      ]).catch(e => logger.error('Failed to write notification log', { error: e.message }));
      
      return { sent: false, error: err.message };
    }
  }

  async sendEmailIncident(incident, recipients) {
    if (!this.emailEnabled) return { sent: false, reason: 'Email not configured' };
    
    let targetRecipients = recipients;
    if (!targetRecipients || targetRecipients.length === 0) {
      const envRecipients = process.env.NOTIFICATION_EMAIL_RECIPIENTS;
      if (envRecipients) targetRecipients = envRecipients.split(',').map(e => e.trim()).filter(e => e);
    }

    if (!targetRecipients || targetRecipients.length === 0) return { sent: false, reason: 'No recipients configured' };

    try {
      const msg = {
        to: targetRecipients,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: process.env.SENDGRID_FROM_NAME || 'SecOps AI Copilot'
        },
        subject: `⚡ SECURITY INCIDENT: ${incident.title}`,
        html: this.buildEmailIncidentHTML(incident),
        trackingSettings: { clickTracking: { enable: false }, openTracking: { enable: false } }
      };

      await sgMail.send(msg);
      
      for (const recipient of targetRecipients) {
        await query(`
          INSERT INTO notification_logs (channel, recipient, subject, message_preview, status, incident_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, ['email', recipient, msg.subject, `Incident Risk: ${incident.risk_score}`, 'sent', incident.id]);
      }
      return { sent: true, recipients: targetRecipients.length };
    } catch (err) {
      logger.error('Failed to send Email incident', { error: err.message });
      return { sent: false, error: err.message };
    }
  }

  shouldNotifyAlert(alert, config) {
    if (!config.is_enabled) return false;
    const sev = alert.severity?.toLowerCase();
    if (sev === 'critical' && config.notify_critical) return true;
    if (sev === 'high' && config.notify_high) return true;
    if (sev === 'medium' && config.notify_medium) return true;
    return false;
  }

  async notifyNewAlert(alert) {
    try {
      const { rows: configs } = await query(`SELECT * FROM notification_configs WHERE is_enabled = true`);
      
      const promises = [];
      const emailRecipients = [];
      
      let slackSent = false;
      
      for (const config of configs) {
        if (this.shouldNotifyAlert(alert, config)) {
          if (config.channel === 'slack' && !slackSent) {
            promises.push(this.sendSlackAlert(alert));
            slackSent = true;
          } else if (config.channel === 'email' && config.config?.recipients) {
            config.config.recipients.forEach(r => {
              if (!emailRecipients.includes(r)) emailRecipients.push(r);
            });
          }
        }
      }
      
      if (emailRecipients.length > 0) {
        promises.push(this.sendEmailAlert(alert, emailRecipients));
      }
      
      // Fallback to env vars if no configs exist yet
      if (configs.length === 0) {
        const sev = alert.severity?.toLowerCase();
        if ((sev === 'critical' && process.env.NOTIFY_ON_CRITICAL === 'true') ||
            (sev === 'high' && process.env.NOTIFY_ON_HIGH === 'true')) {
          promises.push(this.sendSlackAlert(alert));
          promises.push(this.sendEmailAlert(alert));
        }
      }

      if (promises.length > 0) {
        const results = await Promise.allSettled(promises);
        logger.info('Alert notifications processed', { alertId: alert.id, count: promises.length });
        return results;
      }
      return [];
    } catch (err) {
      logger.error('Error processing alert notifications', { error: err.message, alertId: alert.id });
      return [];
    }
  }

  async notifyNewIncident(incident) {
    try {
      const { rows: configs } = await query(`SELECT * FROM notification_configs WHERE is_enabled = true AND notify_on_incident = true`);
      
      const promises = [];
      const emailRecipients = [];
      let slackSent = false;
      
      for (const config of configs) {
        if (config.channel === 'slack' && !slackSent) {
          promises.push(this.sendSlackIncident(incident));
          slackSent = true;
        } else if (config.channel === 'email' && config.config?.recipients) {
          config.config.recipients.forEach(r => {
            if (!emailRecipients.includes(r)) emailRecipients.push(r);
          });
        }
      }
      
      if (emailRecipients.length > 0) {
        promises.push(this.sendEmailIncident(incident, emailRecipients));
      }
      
      if (configs.length === 0 && process.env.NOTIFY_ON_INCIDENT === 'true') {
        promises.push(this.sendSlackIncident(incident));
        promises.push(this.sendEmailIncident(incident));
      }

      await Promise.allSettled(promises);
      return true;
    } catch (err) {
      logger.error('Error processing incident notifications', { error: err.message, incidentId: incident.id });
      return false;
    }
  }

  async getNotificationLogs(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    
    // In a real app we'd filter by userId permissions if needed, but for MVP global is fine
    const { rows: logs } = await query(`
      SELECT * FROM notification_logs 
      ORDER BY sent_at DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const { rows: countRows } = await query(`SELECT COUNT(*) as total FROM notification_logs`);
    const total = parseInt(countRows[0].total, 10);
    
    return {
      logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getNotificationStats() {
    const { rows: today } = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN channel = 'slack' THEN 1 ELSE 0 END) as slack_count,
        SUM(CASE WHEN channel = 'email' THEN 1 ELSE 0 END) as email_count
      FROM notification_logs 
      WHERE sent_at > NOW() - INTERVAL '24 hours'
    `);

    return {
      sentToday: parseInt(today[0]?.total || 0, 10),
      failedToday: parseInt(today[0]?.failed || 0, 10),
      byChannel: {
        slack: parseInt(today[0]?.slack_count || 0, 10),
        email: parseInt(today[0]?.email_count || 0, 10)
      }
    };
  }

  async getOrCreateConfig(userId, channel) {
    let { rows } = await query(`SELECT * FROM notification_configs WHERE user_id = $1 AND channel = $2`, [userId, channel]);
    if (rows.length === 0) {
      let defaultConfig = {};
      if (channel === 'email' && process.env.NOTIFICATION_EMAIL_RECIPIENTS) {
        defaultConfig = { recipients: process.env.NOTIFICATION_EMAIL_RECIPIENTS.split(',').map(e => e.trim()) };
      }
      const { rows: newRows } = await query(`
        INSERT INTO notification_configs (user_id, channel, config)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [userId, channel, defaultConfig]);
      return newRows[0];
    }
    return rows[0];
  }

  async updateConfig(userId, channel, updates) {
    const current = await this.getOrCreateConfig(userId, channel);
    
    const isEnabled = updates.is_enabled !== undefined ? updates.is_enabled : current.is_enabled;
    const config = updates.config !== undefined ? updates.config : current.config;
    const notifyCritical = updates.notify_critical !== undefined ? updates.notify_critical : current.notify_critical;
    const notifyHigh = updates.notify_high !== undefined ? updates.notify_high : current.notify_high;
    const notifyMedium = updates.notify_medium !== undefined ? updates.notify_medium : current.notify_medium;
    const notifyOnIncident = updates.notify_on_incident !== undefined ? updates.notify_on_incident : current.notify_on_incident;

    const { rows } = await query(`
      UPDATE notification_configs
      SET is_enabled = $1, config = $2, notify_critical = $3, notify_high = $4, notify_medium = $5, notify_on_incident = $6, updated_at = NOW()
      WHERE user_id = $7 AND channel = $8
      RETURNING *
    `, [isEnabled, config, notifyCritical, notifyHigh, notifyMedium, notifyOnIncident, userId, channel]);
    
    return rows[0];
  }

  async testNotification(userId, channel) {
    const config = await this.getOrCreateConfig(userId, channel);
    
    const fakeAlert = {
      id: '00000000-0000-0000-0000-000000000000',
      alert_id: 'ALT-TEST-001',
      title: 'Test Notification Alert',
      description: 'This is a test alert generated to verify notification configurations.',
      severity: 'critical',
      status: 'open',
      mitre_tactic: 'Initial Access',
      mitre_technique: 'Phishing',
      source_ip: '192.168.1.100',
      affected_resource: 'user@company.com',
      created_at: new Date()
    };

    if (channel === 'slack') {
      return await this.sendSlackAlert(fakeAlert);
    } else if (channel === 'email') {
      const recipients = config.config?.recipients || [];
      if (recipients.length === 0) return { sent: false, error: 'No recipients configured' };
      return await this.sendEmailAlert(fakeAlert, recipients);
    }
    
    return { sent: false, error: 'Invalid channel' };
  }
}

module.exports = { notificationService: new NotificationService() };
