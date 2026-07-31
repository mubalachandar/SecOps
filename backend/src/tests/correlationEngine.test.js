'use strict';

// ===========================================================================
// Unit tests for CorrelationEngine — pure-logic methods only.
// The correlation functions (correlationFn) are pure JS functions
// operating on in-memory alert arrays. No DB or network required.
// We extract and test them directly from the CORRELATION_RULES array.
// ===========================================================================

jest.mock('../config/database', () => ({
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 })
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));
jest.mock('../services/notificationService', () => ({
  notificationService: {
    notifyNewIncident: jest.fn().mockResolvedValue({})
  }
}));

const { CorrelationEngine } = require('../services/correlationEngine');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeEngine() {
  const engine = new CorrelationEngine();
  // Stop background interval so tests don't hang
  if (engine.intervalRef) clearInterval(engine.intervalRef);
  return engine;
}

function makeAlert(overrides = {}) {
  const base = {
    id: Math.floor(Math.random() * 100000),
    alert_id: `ALT-${Math.random().toString(36).slice(2)}`,
    severity: 'medium',
    status: 'open',
    source_ip: '192.0.2.1',
    mitre_tactic: 'TA0001',
    mitre_technique: 'T1078',
    created_at: new Date().toISOString(),
    raw_event: {}
  };
  return { ...base, ...overrides };
}

function minutesAgo(n) {
  return new Date(Date.now() - n * 60 * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// getHighestSeverity
// ---------------------------------------------------------------------------
describe('CorrelationEngine.getHighestSeverity', () => {
  let engine;
  beforeEach(() => { engine = makeEngine(); });

  test('returns info for empty array', () => {
    expect(engine.getHighestSeverity([])).toBe('info');
  });

  test('returns the single severity for one alert', () => {
    expect(engine.getHighestSeverity([makeAlert({ severity: 'high' })])).toBe('high');
  });

  test('returns critical when mixed severities include critical', () => {
    const alerts = [
      makeAlert({ severity: 'low' }),
      makeAlert({ severity: 'critical' }),
      makeAlert({ severity: 'medium' })
    ];
    expect(engine.getHighestSeverity(alerts)).toBe('critical');
  });

  test('returns high when highest is high', () => {
    const alerts = [makeAlert({ severity: 'medium' }), makeAlert({ severity: 'high' })];
    expect(engine.getHighestSeverity(alerts)).toBe('high');
  });

  test('returns medium when all are medium', () => {
    const alerts = [makeAlert({ severity: 'medium' }), makeAlert({ severity: 'medium' })];
    expect(engine.getHighestSeverity(alerts)).toBe('medium');
  });
});

// ---------------------------------------------------------------------------
// escalateSeverity
// ---------------------------------------------------------------------------
describe('CorrelationEngine.escalateSeverity', () => {
  let engine;
  beforeEach(() => { engine = makeEngine(); });

  test('info → low', () => { expect(engine.escalateSeverity('info')).toBe('low'); });
  test('low → medium', () => { expect(engine.escalateSeverity('low')).toBe('medium'); });
  test('medium → high', () => { expect(engine.escalateSeverity('medium')).toBe('high'); });
  test('high → critical', () => { expect(engine.escalateSeverity('high')).toBe('critical'); });
  test('critical stays critical', () => { expect(engine.escalateSeverity('critical')).toBe('critical'); });
});

// ---------------------------------------------------------------------------
// buildTimeline
// ---------------------------------------------------------------------------
describe('CorrelationEngine.buildTimeline', () => {
  let engine;
  beforeEach(() => { engine = makeEngine(); });

  test('returns empty array for no alerts', () => {
    expect(engine.buildTimeline([])).toEqual([]);
  });

  test('returns alerts sorted chronologically', () => {
    const alerts = [
      makeAlert({ created_at: minutesAgo(5), title: 'Second', alert_id: 'A2', severity: 'high', description: 'd2' }),
      makeAlert({ created_at: minutesAgo(10), title: 'First', alert_id: 'A1', severity: 'medium', description: 'd1' })
    ];
    const timeline = engine.buildTimeline(alerts);
    expect(timeline).toHaveLength(2);
    expect(timeline[0].event).toBe('First');
    expect(timeline[1].event).toBe('Second');
  });

  test('maps alert fields to timeline fields correctly', () => {
    const alert = makeAlert({ title: 'Test Alert', alert_id: 'ALT-XYZ', severity: 'critical', description: 'desc', created_at: '2024-01-01T00:00:00Z' });
    const timeline = engine.buildTimeline([alert]);
    expect(timeline[0]).toMatchObject({
      timestamp: '2024-01-01T00:00:00Z',
      event: 'Test Alert',
      alertId: 'ALT-XYZ',
      severity: 'critical',
      description: 'desc'
    });
  });
});

// ---------------------------------------------------------------------------
// Correlation Rule: same_source_ip
// ---------------------------------------------------------------------------
describe('CorrelationEngine rule: same_source_ip', () => {
  let engine;
  let rule;
  beforeEach(() => {
    engine = makeEngine();
    rule = engine.CORRELATION_RULES.find(r => r.name === 'same_source_ip');
  });

  test('rule exists in CORRELATION_RULES', () => {
    expect(rule).toBeDefined();
  });

  test('groups two alerts from the same IP within 30 minutes', () => {
    const alerts = [
      makeAlert({ source_ip: '1.2.3.4', created_at: minutesAgo(20) }),
      makeAlert({ source_ip: '1.2.3.4', created_at: minutesAgo(10) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
  });

  test('does not group when only one alert from an IP', () => {
    const alerts = [
      makeAlert({ source_ip: '1.2.3.4', created_at: minutesAgo(5) }),
      makeAlert({ source_ip: '5.6.7.8', created_at: minutesAgo(3) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(0);
  });

  test('does not group alerts from same IP when > 30 minutes apart', () => {
    const alerts = [
      makeAlert({ source_ip: '1.2.3.4', created_at: minutesAgo(40) }),
      makeAlert({ source_ip: '1.2.3.4', created_at: minutesAgo(5) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(0);
  });

  test('ignores alerts with no source_ip', () => {
    const alerts = [
      makeAlert({ source_ip: null, created_at: minutesAgo(5) }),
      makeAlert({ source_ip: null, created_at: minutesAgo(3) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(0);
  });

  test('groups multiple IPs independently', () => {
    const alerts = [
      makeAlert({ source_ip: '1.1.1.1', created_at: minutesAgo(10) }),
      makeAlert({ source_ip: '1.1.1.1', created_at: minutesAgo(5) }),
      makeAlert({ source_ip: '2.2.2.2', created_at: minutesAgo(8) }),
      makeAlert({ source_ip: '2.2.2.2', created_at: minutesAgo(2) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Correlation Rule: privilege_escalation_chain
// ---------------------------------------------------------------------------
describe('CorrelationEngine rule: privilege_escalation_chain', () => {
  let engine;
  let rule;
  beforeEach(() => {
    engine = makeEngine();
    rule = engine.CORRELATION_RULES.find(r => r.name === 'privilege_escalation_chain');
  });

  test('detects TA0003 + TA0004 within 60 minutes', () => {
    const alerts = [
      makeAlert({ mitre_tactic: 'TA0003', created_at: minutesAgo(50) }),
      makeAlert({ mitre_tactic: 'TA0004', created_at: minutesAgo(10) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
  });

  test('does not trigger with only TA0003 and no TA0004', () => {
    const alerts = [
      makeAlert({ mitre_tactic: 'TA0003', created_at: minutesAgo(10) }),
      makeAlert({ mitre_tactic: 'TA0001', created_at: minutesAgo(5) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(0);
  });

  test('does not trigger when > 60 minutes apart', () => {
    const alerts = [
      makeAlert({ mitre_tactic: 'TA0003', created_at: minutesAgo(70) }),
      makeAlert({ mitre_tactic: 'TA0004', created_at: minutesAgo(5) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(0);
  });

  test('always assigns high severity', () => {
    const alerts = [makeAlert({ severity: 'medium' }), makeAlert({ severity: 'low' })];
    expect(rule.severity(alerts)).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// Correlation Rule: defense_evasion_precursor
// ---------------------------------------------------------------------------
describe('CorrelationEngine rule: defense_evasion_precursor', () => {
  let engine;
  let rule;
  beforeEach(() => {
    engine = makeEngine();
    rule = engine.CORRELATION_RULES.find(r => r.name === 'defense_evasion_precursor');
  });

  test('detects TA0005 followed by another tactic within 20 minutes', () => {
    const alerts = [
      makeAlert({ mitre_tactic: 'TA0005', created_at: minutesAgo(15) }),
      makeAlert({ mitre_tactic: 'TA0010', created_at: minutesAgo(5) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
  });

  test('does not trigger when follow-up is > 20 minutes after evasion', () => {
    const alerts = [
      makeAlert({ mitre_tactic: 'TA0005', created_at: minutesAgo(30) }),
      makeAlert({ mitre_tactic: 'TA0010', created_at: minutesAgo(5) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(0);
  });

  test('does not trigger when no TA0005 present', () => {
    const alerts = [
      makeAlert({ mitre_tactic: 'TA0001', created_at: minutesAgo(10) }),
      makeAlert({ mitre_tactic: 'TA0010', created_at: minutesAgo(5) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(0);
  });

  test('assigns critical severity', () => {
    expect(rule.severity()).toBe('critical');
  });
});

// ---------------------------------------------------------------------------
// Correlation Rule: data_exfiltration_pattern
// ---------------------------------------------------------------------------
describe('CorrelationEngine rule: data_exfiltration_pattern', () => {
  let engine;
  let rule;
  beforeEach(() => {
    engine = makeEngine();
    rule = engine.CORRELATION_RULES.find(r => r.name === 'data_exfiltration_pattern');
  });

  test('detects TA0009 + TA0010 within 45 minutes', () => {
    const alerts = [
      makeAlert({ mitre_tactic: 'TA0009', created_at: minutesAgo(40) }),
      makeAlert({ mitre_tactic: 'TA0010', created_at: minutesAgo(5) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(1);
  });

  test('does not trigger with only TA0009', () => {
    const alerts = [
      makeAlert({ mitre_tactic: 'TA0009', created_at: minutesAgo(10) }),
      makeAlert({ mitre_tactic: 'TA0001', created_at: minutesAgo(5) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(0);
  });

  test('does not trigger with only TA0010', () => {
    const alerts = [
      makeAlert({ mitre_tactic: 'TA0010', created_at: minutesAgo(5) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(0);
  });

  test('does not trigger when > 45 minutes apart', () => {
    const alerts = [
      makeAlert({ mitre_tactic: 'TA0009', created_at: minutesAgo(50) }),
      makeAlert({ mitre_tactic: 'TA0010', created_at: minutesAgo(1) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(0);
  });

  test('assigns critical severity', () => {
    expect(rule.severity()).toBe('critical');
  });
});

// ---------------------------------------------------------------------------
// Correlation Rule: credential_to_lateral
// ---------------------------------------------------------------------------
describe('CorrelationEngine rule: credential_to_lateral', () => {
  let engine;
  let rule;
  beforeEach(() => {
    engine = makeEngine();
    rule = engine.CORRELATION_RULES.find(r => r.name === 'credential_to_lateral');
  });

  test('detects TA0006 → TA0008 sequence within 30 minutes', () => {
    const alerts = [
      makeAlert({ mitre_tactic: 'TA0006', created_at: minutesAgo(25) }),
      makeAlert({ mitre_tactic: 'TA0008', created_at: minutesAgo(5) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
  });

  test('does not trigger when lateral movement comes first', () => {
    const alerts = [
      makeAlert({ mitre_tactic: 'TA0008', created_at: minutesAgo(25) }),
      makeAlert({ mitre_tactic: 'TA0006', created_at: minutesAgo(5) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(0);
  });

  test('does not trigger when > 30 minutes apart', () => {
    const alerts = [
      makeAlert({ mitre_tactic: 'TA0006', created_at: minutesAgo(35) }),
      makeAlert({ mitre_tactic: 'TA0008', created_at: minutesAgo(2) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(0);
  });

  test('assigns critical severity', () => {
    expect(rule.severity()).toBe('critical');
  });
});

// ---------------------------------------------------------------------------
// Correlation Rule: same_resource_targeted
// ---------------------------------------------------------------------------
describe('CorrelationEngine rule: same_resource_targeted', () => {
  let engine;
  let rule;
  beforeEach(() => {
    engine = makeEngine();
    rule = engine.CORRELATION_RULES.find(r => r.name === 'same_resource_targeted');
  });

  test('groups 3+ alerts targeting the same S3 bucket within 60 minutes', () => {
    const bucket = 'critical-data-bucket';
    const rawEvt = { requestParameters: { bucketName: bucket } };
    const alerts = [
      makeAlert({ raw_event: rawEvt, created_at: minutesAgo(50) }),
      makeAlert({ raw_event: rawEvt, created_at: minutesAgo(30) }),
      makeAlert({ raw_event: rawEvt, created_at: minutesAgo(10) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(3);
  });

  test('requires at least 3 alerts to form a group (2 is not enough)', () => {
    const bucket = 'test-bucket';
    const rawEvt = { requestParameters: { bucketName: bucket } };
    const alerts = [
      makeAlert({ raw_event: rawEvt, created_at: minutesAgo(20) }),
      makeAlert({ raw_event: rawEvt, created_at: minutesAgo(10) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(0);
  });

  test('groups by ARN when bucket name not available', () => {
    const arn = 'arn:aws:s3:::my-important-bucket';
    const rawEvt = { resources: [{ ARN: arn }] };
    const alerts = [
      makeAlert({ raw_event: rawEvt, created_at: minutesAgo(40) }),
      makeAlert({ raw_event: rawEvt, created_at: minutesAgo(20) }),
      makeAlert({ raw_event: rawEvt, created_at: minutesAgo(5) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(1);
  });

  test('does not group when > 60 minutes apart', () => {
    const rawEvt = { requestParameters: { bucketName: 'bucket' } };
    const alerts = [
      makeAlert({ raw_event: rawEvt, created_at: minutesAgo(80) }),
      makeAlert({ raw_event: rawEvt, created_at: minutesAgo(40) }),
      makeAlert({ raw_event: rawEvt, created_at: minutesAgo(0) })
    ];
    const groups = rule.correlationFn(alerts);
    expect(groups).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// CORRELATION_RULES structure
// ---------------------------------------------------------------------------
describe('CorrelationEngine.CORRELATION_RULES structure', () => {
  let engine;
  beforeEach(() => { engine = makeEngine(); });

  test('contains exactly 6 correlation rules', () => {
    expect(engine.CORRELATION_RULES).toHaveLength(6);
  });

  const expectedRules = [
    'same_source_ip',
    'privilege_escalation_chain',
    'defense_evasion_precursor',
    'data_exfiltration_pattern',
    'credential_to_lateral',
    'same_resource_targeted'
  ];

  expectedRules.forEach(name => {
    test(`rule "${name}" exists and has required fields`, () => {
      const rule = engine.CORRELATION_RULES.find(r => r.name === name);
      expect(rule).toBeDefined();
      expect(typeof rule.correlationFn).toBe('function');
      expect(rule.killChainPhase).toBeDefined();
      expect(rule.attackPattern).toBeDefined();
    });
  });
});
