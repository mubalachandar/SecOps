require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initializeDatabase, query, pool } = require('../config/database');
const logger = require('../utils/logger');

const users = [
  { email: 'admin@secops.local', password: 'Admin@123456', fullName: 'SecOps Administrator', role: 'admin' },
  { email: 'analyst@secops.local', password: 'Analyst@123456', fullName: 'SecOps Analyst', role: 'analyst' }
];

const rules = [
  ['SECOPS-001', 'Root Account Usage', 'Detects interactive AWS root account usage.', 'critical', 'TA0004 Privilege Escalation', 'T1078.004', { eventName: 'ConsoleLogin', 'userIdentity.type': 'Root' }, 1, 5],
  ['SECOPS-002', 'IAM User Created', 'Detects creation of IAM users that can establish persistence.', 'high', 'TA0003 Persistence', 'T1136.003', { eventName: 'CreateUser' }, 1, 5],
  ['SECOPS-003', 'Security Group Modified', 'Detects modifications to security group ingress controls.', 'high', 'TA0005 Defense Evasion', 'T1562.007', { eventName: ['AuthorizeSecurityGroupIngress', 'RevokeSecurityGroupIngress'] }, 1, 5],
  ['SECOPS-004', 'S3 Bucket Made Public', 'Detects S3 ACL changes that grant public read access.', 'critical', 'TA0010 Exfiltration', 'T1537', { eventName: 'PutBucketAcl', requestParametersContains: 'PublicRead' }, 1, 5],
  ['SECOPS-005', 'CloudTrail Logging Disabled', 'Detects attempts to stop CloudTrail logging.', 'critical', 'TA0005 Defense Evasion', 'T1562.008', { eventName: 'StopLogging' }, 1, 5],
  ['SECOPS-006', 'Multiple Failed Logins', 'Detects repeated failed AWS console authentication events.', 'high', 'TA0006 Credential Access', 'T1110', { eventName: 'ConsoleLogin', errorCode: 'Failed authentication' }, 5, 10],
  ['SECOPS-007', 'IAM Policy Attached to User', 'Detects policy attachment that may elevate IAM user permissions.', 'medium', 'TA0004 Privilege Escalation', 'T1098.003', { eventName: 'AttachUserPolicy' }, 1, 5],
  ['SECOPS-008', 'EC2 Instance Launched in New Region', 'Detects EC2 instance launches that can support cross-region movement.', 'medium', 'TA0008 Lateral Movement', 'T1578.002', { eventName: 'RunInstances' }, 1, 5],
  ['SECOPS-009', 'KMS Key Deleted', 'Detects scheduled KMS key deletion that can impact data availability.', 'critical', 'TA0040 Impact', 'T1485', { eventName: 'ScheduleKeyDeletion' }, 1, 5],
  ['SECOPS-010', 'GuardDuty Detector Disabled', 'Detects deletion of GuardDuty detectors.', 'critical', 'TA0005 Defense Evasion', 'T1562', { eventName: 'DeleteDetector' }, 1, 5]
];

// Helper to generate a random element from an array
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const realisticIps = ['13.234.12.11','103.111.45.1','115.112.56.23','122.163.45.98','49.207.12.100','103.77.108.15'];
const randomIp = () => realisticIps[Math.floor(Math.random() * realisticIps.length)];
const awsRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'];
const eventNames = ['ConsoleLogin', 'CreateUser', 'AttachUserPolicy', 'StopLogging', 'PutBucketAcl', 'RunInstances', 'ScheduleKeyDeletion', 'DeleteDetector', 'AuthorizeSecurityGroupIngress', 'GetObject'];
const sources = ['signin.amazonaws.com', 'iam.amazonaws.com', 'cloudtrail.amazonaws.com', 's3.amazonaws.com', 'ec2.amazonaws.com', 'kms.amazonaws.com', 'guardduty.amazonaws.com'];

async function seedUsers() {
  try {
    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 12);
      await query(
        `INSERT INTO users (email, password_hash, full_name, role, is_active)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_active = TRUE, updated_at = NOW()`,
        [user.email, passwordHash, user.fullName, user.role]
      );
    }
  } catch (error) { logger.error('Default user seeding failed', { error: error.message }); throw error; }
}

async function seedRules() {
  try {
    for (const [ruleId, name, description, severity, tactic, technique, patterns, threshold, windowMinutes] of rules) {
      await query(
        `INSERT INTO detection_rules (rule_id, name, description, severity, mitre_tactic, mitre_technique, event_patterns, threshold, time_window_minutes)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
         ON CONFLICT (rule_id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, severity = EXCLUDED.severity,
         mitre_tactic = EXCLUDED.mitre_tactic, mitre_technique = EXCLUDED.mitre_technique, event_patterns = EXCLUDED.event_patterns,
         threshold = EXCLUDED.threshold, time_window_minutes = EXCLUDED.time_window_minutes, updated_at = NOW()`,
        [ruleId, name, description, severity, tactic, technique, JSON.stringify(patterns), threshold, windowMinutes]
      );
    }
  } catch (error) { logger.error('Detection rule seeding failed', { error: error.message }); throw error; }
}

async function seedSampleData() {
  try {
    // 25 Alerts (5 of each category as specified)
    const alertConfigurations = [
      ...Array(5).fill({ severity: 'critical', status: 'open' }),
      ...Array(5).fill({ severity: 'high', status: 'open' }),
      ...Array(5).fill({ severity: 'high', status: 'investigating' }),
      ...Array(5).fill({ severity: 'medium', status: 'resolved' }),
      ...Array(5).fill({ severity: 'low', status: 'resolved' })
    ];

    const alertIds = [];
    for (const [index, conf] of alertConfigurations.entries()) {
      const rule = randomElement(rules);
      const res = await query(
        `INSERT INTO alerts (alert_id, severity, status, title, description, source, event_type, raw_event, mitre_tactic, mitre_technique, source_ip, region, timestamp, risk_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, NOW() - INTERVAL '${index * 2} hours', $13)
         RETURNING id`,
        [
          `ALT-${1000 + index}`, conf.severity, conf.status, rule[1], rule[2], randomElement(sources), rule[6].eventName || 'Unknown',
          JSON.stringify({ eventName: rule[6].eventName || 'Unknown' }), rule[4], rule[5], randomIp(), randomElement(awsRegions), Math.floor(Math.random() * 40) + (conf.severity === 'critical' ? 60 : 20)
        ]
      );
      alertIds.push(res.rows[0].id);
    }

    // 10 AI Analyses
    for (let i = 0; i < 10; i++) {
      const alertId = alertIds[i];
      await query(
        `INSERT INTO alert_analyses (alert_id, analysis_text, risk_score, recommended_actions, false_positive_probability, ai_model)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
        [
          alertId,
          "Gemini 1.5 Pro analysis indicates this activity matches known adversary tactics. The user agent and IP address are highly suspicious.",
          85,
          JSON.stringify(["Revoke active sessions for the user", "Rotate access keys", "Enable MFA immediately"]),
          0.05,
          "gemini-3.5-flash"
        ]
      );
    }

    // 50 CloudTrail Events
    for (let i = 0; i < 50; i++) {
      await query(
        `INSERT INTO cloudtrail_events (event_id, event_name, event_source, event_time, aws_region, source_ip, user_identity, raw_event)
         VALUES ($1, $2, $3, NOW() - INTERVAL '${i * 30} minutes', $4, $5, $6::jsonb, $7::jsonb)`,
        [
          `evt-${Math.random().toString(36).substring(7)}`,
          randomElement(eventNames),
          randomElement(sources),
          randomElement(awsRegions),
          randomIp(),
          JSON.stringify({ type: 'IAMUser', userName: `user-${i}` }),
          JSON.stringify({ detail: "Simulated event payload" })
        ]
      );
    }

    logger.info('Sample data (alerts, analyses, cloudtrail events) seeded successfully.');
  } catch (error) {
    logger.error('Sample data seeding failed', { error: error.message });
    throw error;
  }
}

async function seed() {
  try {
    await initializeDatabase();
    
    // Create Incidents Tables
    await query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        incident_id VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        severity VARCHAR(20) NOT NULL,
        status VARCHAR(30) DEFAULT 'active',
        risk_score INTEGER DEFAULT 0,
        alert_count INTEGER DEFAULT 0,
        affected_resources JSONB DEFAULT '[]',
        source_ips JSONB DEFAULT '[]',
        mitre_tactics JSONB DEFAULT '[]',
        mitre_techniques JSONB DEFAULT '[]',
        attack_pattern VARCHAR(100),
        kill_chain_phase VARCHAR(50),
        first_seen TIMESTAMPTZ,
        last_seen TIMESTAMPTZ,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS incident_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
        alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
        correlation_reason TEXT,
        added_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(incident_id, alert_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
      CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
      CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at);

      CREATE TABLE IF NOT EXISTS notification_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        channel VARCHAR(20) NOT NULL,
        is_enabled BOOLEAN DEFAULT true,
        config JSONB NOT NULL DEFAULT '{}',
        notify_critical BOOLEAN DEFAULT true,
        notify_high BOOLEAN DEFAULT false,
        notify_medium BOOLEAN DEFAULT false,
        notify_on_incident BOOLEAN DEFAULT true,
        notify_on_new_rule_trigger BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, channel)
      );

      CREATE TABLE IF NOT EXISTS notification_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel VARCHAR(20) NOT NULL,
        recipient VARCHAR(500),
        subject VARCHAR(500),
        message_preview TEXT,
        status VARCHAR(20) DEFAULT 'sent',
        error_message TEXT,
        alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
        incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
        sent_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_notification_logs_sent ON notification_logs(sent_at);
      CREATE INDEX IF NOT EXISTS idx_notification_configs_user ON notification_configs(user_id);
      
      -- Reports
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        report_type VARCHAR(50) NOT NULL,
        period_start TIMESTAMPTZ NOT NULL,
        period_end TIMESTAMPTZ NOT NULL,
        generated_by UUID REFERENCES users(id),
        file_size INTEGER,
        alert_count INTEGER DEFAULT 0,
        incident_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'generating',
        file_path VARCHAR(500),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);
      CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_incident_alerts_incident ON incident_alerts(incident_id);
    `);
    
    await seedUsers();
    await seedRules();
    await seedSampleData();
    logger.info('Database seed completed', { users: users.length, detectionRules: rules.length });
  } catch (error) {
    logger.error('Database seed failed', { error: error.message, stack: error.stack });
    process.exitCode = 1;
  } finally {
    if (pool) {
      try { await pool.end(); } catch (error) { logger.error('Database pool shutdown failed', { error: error.message }); process.exitCode = 1; }
    }
  }
}

if (require.main === module) seed().catch((error) => { logger.error('Unhandled seed failure', { error: error.message, stack: error.stack }); process.exitCode = 1; });
module.exports = { seed, seedUsers, seedRules, rules, seedSampleData };
