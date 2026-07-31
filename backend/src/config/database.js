const { Pool } = require('pg');
const logger = require('../utils/logger');

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
  max: Number(process.env.DATABASE_POOL_MAX || 10),
  idleTimeoutMillis: 10000,    // release idle connections after 10s (prevents exhaustion on small instances)
  connectionTimeoutMillis: 2000 // fail-fast: give up acquiring a connection after 2s under load
}) : null;

if (pool) {
  pool.on('error', (error) => {
    logger.error('Unexpected PostgreSQL pool error', { error: error.message });
  });
}

async function query(text, params) {
  if (!pool) throw new Error('DATABASE_URL is not configured');
  return pool.query(text, params);
}

async function testDatabaseConnection(retries = 5, delay = 3000) {
  if (!pool) { logger.warn('DATABASE_URL is not configured; database features are disabled'); return false; }
  for (let attempt = 1; attempt <= retries; attempt++) {
    try { 
      await query('SELECT 1'); 
      logger.info('PostgreSQL connection established'); 
      return true; 
    } catch (error) { 
      logger.warn(`PostgreSQL connection test failed (Attempt ${attempt}/${retries})`, { error: error.message }); 
      if (attempt < retries) {
        await new Promise(res => setTimeout(res, delay));
      } else {
        logger.error('PostgreSQL connection failed after all retries');
        return false;
      }
    }
  }
}

async function healthCheck() {
  if (!pool) return false;
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
}

async function initializeDatabase() {
  if (!pool) { logger.warn('Skipping database initialization because DATABASE_URL is not configured'); return; }
  await query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await query(`DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('critical', 'high', 'medium', 'low', 'info');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  await query(`DO $$ BEGIN
    CREATE TYPE alert_status AS ENUM ('open', 'investigating', 'resolved', 'false_positive');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  await query(`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL, role VARCHAR(50) NOT NULL DEFAULT 'analyst', is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_login TIMESTAMPTZ
  )`);
  await query(`CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), alert_id VARCHAR(100) UNIQUE NOT NULL, severity alert_severity NOT NULL,
    status alert_status NOT NULL DEFAULT 'open', title VARCHAR(500) NOT NULL, description TEXT NOT NULL, source VARCHAR(100) NOT NULL,
    event_type VARCHAR(255), raw_event JSONB NOT NULL DEFAULT '{}'::jsonb, mitre_tactic VARCHAR(255), mitre_technique VARCHAR(255),
    affected_resource VARCHAR(500), source_ip INET, user_agent TEXT, region VARCHAR(100), timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL
  )`);
  await query('ALTER TABLE alerts ADD COLUMN IF NOT EXISTS risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100)');
  await query(`CREATE TABLE IF NOT EXISTS alert_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    analysis_text TEXT NOT NULL, risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100), recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    false_positive_probability DOUBLE PRECISION CHECK (false_positive_probability BETWEEN 0 AND 1), ai_model VARCHAR(100) NOT NULL,
    tokens_used INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await query(`CREATE TABLE IF NOT EXISTS cloudtrail_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_id VARCHAR(255) UNIQUE NOT NULL, event_name VARCHAR(255) NOT NULL,
    event_source VARCHAR(255) NOT NULL, event_time TIMESTAMPTZ NOT NULL, aws_region VARCHAR(100), source_ip INET,
    user_identity JSONB NOT NULL DEFAULT '{}'::jsonb, request_parameters JSONB, response_elements JSONB, error_code VARCHAR(255),
    error_message TEXT, raw_event JSONB NOT NULL, processed_at TIMESTAMPTZ, alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL
  )`);
  await query(`CREATE TABLE IF NOT EXISTS detection_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), rule_id VARCHAR(100) UNIQUE NOT NULL, name VARCHAR(255) NOT NULL, description TEXT NOT NULL,
    severity alert_severity NOT NULL, mitre_tactic VARCHAR(255), mitre_technique VARCHAR(255), event_patterns JSONB NOT NULL,
    threshold INTEGER NOT NULL DEFAULT 1 CHECK (threshold > 0), time_window_minutes INTEGER NOT NULL DEFAULT 5 CHECK (time_window_minutes > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await query(`CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE SET NULL, action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL, resource_id VARCHAR(255), details JSONB NOT NULL DEFAULT '{}'::jsonb, ip_address INET,
    user_agent TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await query(`CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), metric_name VARCHAR(255) NOT NULL, metric_value DOUBLE PRECISION NOT NULL,
    labels JSONB NOT NULL DEFAULT '{}'::jsonb, recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await query('CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity)');
  await query('CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)');
  await query('CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC)');
  await query('CREATE INDEX IF NOT EXISTS idx_cloudtrail_events_event_time ON cloudtrail_events(event_time DESC)');
  await query('CREATE INDEX IF NOT EXISTS idx_cloudtrail_events_event_name ON cloudtrail_events(event_name)');
  await query('CREATE INDEX IF NOT EXISTS idx_detection_rules_is_active ON detection_rules(is_active)');
  logger.info('Database schema initialized');
}

module.exports = { pool, query, testDatabaseConnection, initializeDatabase, healthCheck };
