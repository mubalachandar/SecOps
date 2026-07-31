'use strict';

// ===========================================================================
// Unit tests for DetectionEngine — pure logic only, no DB / Redis / network.
// The engine's core methods (normalizeEvent, evaluateRule, _evaluatePattern,
// _combine, _matchTyped, _passesThreshold, _affectedResource) are all
// deterministic and can be exercised without any I/O.
// ===========================================================================

// Prevent the module-level singleton (which starts intervals / DB queries)
// from running by mocking all I/O dependencies before require().
jest.mock('../config/database', () => ({
  pool: null,
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 })
}));
jest.mock('../config/redis', () => ({
  getJSON: jest.fn().mockResolvedValue(null),
  setJSON: jest.fn().mockResolvedValue('OK'),
  client: null
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));
jest.mock('../services/alertService', () => ({
  triggerAIAnalysis: jest.fn().mockResolvedValue({})
}));
jest.mock('../services/correlationEngine', () => ({
  correlationEngine: { correlateAlerts: jest.fn().mockResolvedValue({}) }
}));
jest.mock('../services/websocketService', () => ({
  websocketService: { broadcastNewAlert: jest.fn() }
}));
jest.mock('../services/notificationService', () => ({
  notificationService: {
    notifyNewAlert: jest.fn().mockResolvedValue({}),
    notifyNewIncident: jest.fn().mockResolvedValue({})
  }
}));

// Now it's safe to require the engine — it will use the mocked deps
const { DetectionEngine } = require('../services/detectionEngine');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeEngine() {
  return new DetectionEngine();
}

function rawEvent(overrides = {}) {
  return {
    eventID: 'evt-001',
    eventName: 'ConsoleLogin',
    eventSource: 'signin.amazonaws.com',
    eventTime: '2024-01-15T10:00:00Z',
    awsRegion: 'us-east-1',
    sourceIPAddress: '192.0.2.1',
    userAgent: 'aws-cli/2.0',
    userIdentity: { type: 'Root', arn: 'arn:aws:iam::123:root' },
    requestParameters: { bucketName: 'my-bucket' },
    responseElements: { ConsoleLogin: 'Success' },
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// normalizeEvent
// ---------------------------------------------------------------------------
describe('DetectionEngine.normalizeEvent', () => {
  let engine;
  beforeEach(() => { engine = makeEngine(); });

  test('normalizes a complete event correctly', () => {
    const result = engine.normalizeEvent(rawEvent());
    expect(result.eventId).toBe('evt-001');
    expect(result.eventName).toBe('ConsoleLogin');
    expect(result.eventSource).toBe('signin.amazonaws.com');
    expect(result.awsRegion).toBe('us-east-1');
    expect(result.sourceIPAddress).toBe('192.0.2.1');
    expect(result.userIdentity.type).toBe('Root');
    expect(result.rawEvent).toBeDefined();
  });

  test('generates a deterministic eventId when eventID is missing', () => {
    const event = rawEvent();
    delete event.eventID;
    const r1 = engine.normalizeEvent(event);
    const r2 = engine.normalizeEvent(event);
    expect(r1.eventId).toBe(r2.eventId);
    expect(r1.eventId).toHaveLength(64); // sha256 hex
  });

  test('defaults awsRegion to us-east-1 when missing', () => {
    const event = rawEvent();
    delete event.awsRegion;
    const result = engine.normalizeEvent(event);
    expect(result.awsRegion).toBe('us-east-1');
  });

  test('accepts sourceIp as alias for sourceIPAddress', () => {
    const event = rawEvent({ sourceIPAddress: undefined, sourceIp: '10.0.0.1' });
    const result = engine.normalizeEvent(event);
    expect(result.sourceIPAddress).toBe('10.0.0.1');
  });

  test('throws when input is not an object', () => {
    expect(() => engine.normalizeEvent(null)).toThrow('CloudTrail event must be an object.');
    expect(() => engine.normalizeEvent('string')).toThrow('CloudTrail event must be an object.');
    expect(() => engine.normalizeEvent(42)).toThrow();
  });

  test('throws when eventName is missing', () => {
    const event = rawEvent();
    delete event.eventName;
    expect(() => engine.normalizeEvent(event)).toThrow('CloudTrail event requires eventName and eventSource.');
  });

  test('throws when eventSource is missing', () => {
    const event = rawEvent();
    delete event.eventSource;
    expect(() => engine.normalizeEvent(event)).toThrow('CloudTrail event requires eventName and eventSource.');
  });

  test('converts eventTime to ISO string', () => {
    const result = engine.normalizeEvent(rawEvent({ eventTime: '2024-01-15T10:00:00Z' }));
    expect(result.eventTime).toBe('2024-01-15T10:00:00.000Z');
  });

  test('defaults eventTime to current time when missing', () => {
    const before = Date.now();
    const event = rawEvent();
    delete event.eventTime;
    const result = engine.normalizeEvent(event);
    const after = Date.now();
    const parsed = new Date(result.eventTime).getTime();
    expect(parsed).toBeGreaterThanOrEqual(before);
    expect(parsed).toBeLessThanOrEqual(after);
  });
});

// ---------------------------------------------------------------------------
// _matchTyped — all 5 pattern types
// ---------------------------------------------------------------------------
describe('DetectionEngine._matchTyped', () => {
  let engine;
  beforeEach(() => { engine = makeEngine(); });

  const event = {
    eventName: 'ConsoleLogin',
    eventSource: 'signin.amazonaws.com',
    userIdentity: { type: 'Root', arn: 'arn:aws:iam::123:root' },
    sourceIPAddress: '192.0.2.1',
    requestParameters: { bucketName: 'confidential-bucket', policy: '{"Effect":"Allow"}' }
  };

  // exact_match
  test('exact_match: returns matched=true when field value equals pattern value', () => {
    const result = engine._matchTyped({ type: 'exact_match', field: 'eventName', value: 'ConsoleLogin' }, event);
    expect(result.matched).toBe(true);
    expect(result.matchedPatterns).toHaveLength(1);
  });

  test('exact_match: returns matched=false when value differs', () => {
    const result = engine._matchTyped({ type: 'exact_match', field: 'eventName', value: 'GetObject' }, event);
    expect(result.matched).toBe(false);
    expect(result.matchedPatterns).toHaveLength(0);
  });

  test('exact_match: works on nested fields via dot notation', () => {
    const result = engine._matchTyped({ type: 'exact_match', field: 'userIdentity.type', value: 'Root' }, event);
    expect(result.matched).toBe(true);
  });

  // contains
  test('contains: matches substring in string field', () => {
    const result = engine._matchTyped({ type: 'contains', field: 'userIdentity.arn', value: 'root' }, event);
    expect(result.matched).toBe(true);
  });

  test('contains: matches substring in serialized object field', () => {
    const result = engine._matchTyped({ type: 'contains', field: 'requestParameters', value: 'confidential' }, event);
    expect(result.matched).toBe(true);
  });

  test('contains: returns false when substring not present', () => {
    const result = engine._matchTyped({ type: 'contains', field: 'eventName', value: 'DeleteBucket' }, event);
    expect(result.matched).toBe(false);
  });

  // in_list
  test('in_list: matches when value is in the list', () => {
    const result = engine._matchTyped({ type: 'in_list', field: 'eventName', values: ['ConsoleLogin', 'GetObject', 'DeleteBucket'] }, event);
    expect(result.matched).toBe(true);
  });

  test('in_list: returns false when value not in list', () => {
    const result = engine._matchTyped({ type: 'in_list', field: 'eventName', values: ['GetObject', 'PutObject'] }, event);
    expect(result.matched).toBe(false);
  });

  test('in_list: accepts single value in `value` field (not array)', () => {
    const result = engine._matchTyped({ type: 'in_list', field: 'eventName', value: 'ConsoleLogin' }, event);
    expect(result.matched).toBe(true);
  });

  // regex
  test('regex: matches regex pattern', () => {
    const result = engine._matchTyped({ type: 'regex', field: 'sourceIPAddress', value: '^192\\.0\\.2\\.' }, event);
    expect(result.matched).toBe(true);
  });

  test('regex: returns false when pattern does not match', () => {
    const result = engine._matchTyped({ type: 'regex', field: 'sourceIPAddress', value: '^10\\.0\\.' }, event);
    expect(result.matched).toBe(false);
  });

  test('regex: handles invalid regex gracefully without throwing', () => {
    const result = engine._matchTyped({ type: 'regex', field: 'eventName', value: '[invalid(regex' }, event);
    expect(result.matched).toBe(false); // logs warning, does not throw
  });

  test('regex: respects flags option', () => {
    const result = engine._matchTyped({ type: 'regex', field: 'eventName', value: 'consolelogin', flags: 'i' }, event);
    expect(result.matched).toBe(true);
  });

  // json_path
  test('json_path: exact match on nested path', () => {
    const result = engine._matchTyped({ type: 'json_path', field: 'requestParameters.bucketName', value: 'confidential-bucket' }, event);
    expect(result.matched).toBe(true);
  });

  test('json_path: contains operator on nested path', () => {
    const result = engine._matchTyped({ type: 'json_path', path: 'requestParameters.bucketName', operator: 'contains', value: 'confidential' }, event);
    expect(result.matched).toBe(true);
  });

  // unknown type
  test('unknown pattern type returns matched=false without throwing', () => {
    const result = engine._matchTyped({ type: 'UNKNOWN_TYPE', field: 'eventName', value: 'ConsoleLogin' }, event);
    expect(result.matched).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// _combine — AND / OR composite
// ---------------------------------------------------------------------------
describe('DetectionEngine._combine', () => {
  let engine;
  beforeEach(() => { engine = makeEngine(); });

  const event = { eventName: 'ConsoleLogin', userIdentity: { type: 'Root' } };

  const matchingPattern = { type: 'exact_match', field: 'eventName', value: 'ConsoleLogin' };
  const nonMatchingPattern = { type: 'exact_match', field: 'eventName', value: 'GetObject' };

  test('AND: returns matched=true when all sub-patterns match', () => {
    const result = engine._combine('AND', [matchingPattern, { type: 'exact_match', field: 'userIdentity.type', value: 'Root' }], event);
    expect(result.matched).toBe(true);
  });

  test('AND: returns matched=false when any sub-pattern fails', () => {
    const result = engine._combine('AND', [matchingPattern, nonMatchingPattern], event);
    expect(result.matched).toBe(false);
    expect(result.matchedPatterns).toHaveLength(0);
  });

  test('OR: returns matched=true when at least one sub-pattern matches', () => {
    const result = engine._combine('OR', [nonMatchingPattern, matchingPattern], event);
    expect(result.matched).toBe(true);
    expect(result.matchedPatterns).toHaveLength(1);
  });

  test('OR: returns matched=false when no sub-pattern matches', () => {
    const result = engine._combine('OR', [nonMatchingPattern, { type: 'exact_match', field: 'eventName', value: 'DeleteBucket' }], event);
    expect(result.matched).toBe(false);
  });

  test('AND with empty pattern array returns matched=true (vacuously true)', () => {
    const result = engine._combine('AND', [], event);
    expect(result.matched).toBe(true);
  });

  test('OR with empty pattern array returns matched=false', () => {
    const result = engine._combine('OR', [], event);
    expect(result.matched).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// evaluateRule — full rule evaluation pipeline
// ---------------------------------------------------------------------------
describe('DetectionEngine.evaluateRule', () => {
  let engine;
  beforeEach(() => { engine = makeEngine(); });

  const event = {
    eventName: 'ConsoleLogin',
    userIdentity: { type: 'Root' },
    sourceIPAddress: '1.2.3.4'
  };

  test('evaluates a simple exact_match rule correctly', () => {
    const rule = {
      rule_id: 'R001',
      event_patterns: [{ type: 'exact_match', field: 'eventName', value: 'ConsoleLogin' }]
    };
    const result = engine.evaluateRule(rule, event);
    expect(result.matched).toBe(true);
  });

  test('evaluates a composite AND rule', () => {
    const rule = {
      rule_id: 'R002',
      event_patterns: {
        type: 'composite',
        operator: 'AND',
        patterns: [
          { type: 'exact_match', field: 'eventName', value: 'ConsoleLogin' },
          { type: 'exact_match', field: 'userIdentity.type', value: 'Root' }
        ]
      }
    };
    const result = engine.evaluateRule(rule, event);
    expect(result.matched).toBe(true);
  });

  test('evaluates composite AND rule as false when one pattern fails', () => {
    const rule = {
      rule_id: 'R003',
      event_patterns: {
        type: 'composite',
        operator: 'AND',
        patterns: [
          { type: 'exact_match', field: 'eventName', value: 'ConsoleLogin' },
          { type: 'exact_match', field: 'userIdentity.type', value: 'IAMUser' } // won't match Root
        ]
      }
    };
    const result = engine.evaluateRule(rule, event);
    expect(result.matched).toBe(false);
  });

  test('evaluates rule with JSON string event_patterns', () => {
    const rule = {
      rule_id: 'R004',
      event_patterns: JSON.stringify([{ type: 'exact_match', field: 'eventName', value: 'ConsoleLogin' }])
    };
    const result = engine.evaluateRule(rule, event);
    expect(result.matched).toBe(true);
  });

  test('returns matched=false on invalid JSON event_patterns (does not throw)', () => {
    const rule = { rule_id: 'R005', event_patterns: 'NOT_VALID_JSON{{{' };
    const result = engine.evaluateRule(rule, event);
    expect(result.matched).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// _passesThreshold — sliding window counter
// ---------------------------------------------------------------------------
describe('DetectionEngine._passesThreshold', () => {
  let engine;
  beforeEach(() => { engine = makeEngine(); });

  const baseEvent = { sourceIPAddress: '10.0.0.1', userIdentity: {}, eventTime: new Date().toISOString() };
  const rule = { rule_id: 'R-BRUTE', id: 'brute-001', threshold: 3, time_window_minutes: 5 };

  test('threshold=1: always passes without tracking', () => {
    const r = { rule_id: 'R', id: 'r1', threshold: 1, time_window_minutes: 5 };
    expect(engine._passesThreshold(r, baseEvent, { matchedPatterns: [] })).toBe(true);
  });

  test('threshold=3: does not fire on first and second occurrence', () => {
    const result1 = { matchedPatterns: [] };
    const result2 = { matchedPatterns: [] };
    expect(engine._passesThreshold(rule, baseEvent, result1)).toBe(false);
    expect(engine._passesThreshold(rule, baseEvent, result2)).toBe(false);
  });

  test('threshold=3: fires on exactly the 3rd occurrence within window', () => {
    const r = { rule_id: 'R-UNIQUE', id: 'r-unique', threshold: 3, time_window_minutes: 5 };
    const result = { matchedPatterns: [] };
    engine._passesThreshold(r, baseEvent, { matchedPatterns: [] });
    engine._passesThreshold(r, baseEvent, { matchedPatterns: [] });
    const fired = engine._passesThreshold(r, baseEvent, result);
    expect(fired).toBe(true);
    expect(result.matchedPatterns.some(p => p.type === 'threshold')).toBe(true);
  });

  test('threshold=3: does not fire on 4th occurrence (exact threshold only)', () => {
    const r = { rule_id: 'R-EXACT', id: 'r-exact', threshold: 3, time_window_minutes: 5 };
    const result = { matchedPatterns: [] };
    engine._passesThreshold(r, baseEvent, { matchedPatterns: [] });
    engine._passesThreshold(r, baseEvent, { matchedPatterns: [] });
    engine._passesThreshold(r, baseEvent, { matchedPatterns: [] }); // fires here
    const fourth = engine._passesThreshold(r, baseEvent, result);
    expect(fourth).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// _affectedResource — resource extraction
// ---------------------------------------------------------------------------
describe('DetectionEngine._affectedResource', () => {
  let engine;
  beforeEach(() => { engine = makeEngine(); });

  test('returns bucketName when present', () => {
    const event = { requestParameters: { bucketName: 'my-secret-bucket' }, resources: [] };
    expect(engine._affectedResource(event)).toBe('my-secret-bucket');
  });

  test('returns instanceId when present', () => {
    const event = { requestParameters: { instanceId: 'i-abc123' }, resources: [] };
    expect(engine._affectedResource(event)).toBe('i-abc123');
  });

  test('returns userName when present', () => {
    const event = { requestParameters: { userName: 'alice' }, resources: [] };
    expect(engine._affectedResource(event)).toBe('alice');
  });

  test('returns ARN from resources when requestParameters has no match', () => {
    const event = { requestParameters: {}, resources: [{ ARN: 'arn:aws:s3:::my-bucket' }] };
    expect(engine._affectedResource(event)).toBe('arn:aws:s3:::my-bucket');
  });

  test('returns null when no resource can be extracted', () => {
    const event = { requestParameters: {}, resources: [] };
    expect(engine._affectedResource(event)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// processBatch — array validation
// ---------------------------------------------------------------------------
describe('DetectionEngine.processBatch', () => {
  let engine;
  beforeEach(() => { engine = makeEngine(); });

  test('throws when events is not an array', async () => {
    await expect(engine.processBatch('not-an-array')).rejects.toThrow('Events must be an array.');
    await expect(engine.processBatch(null)).rejects.toThrow('Events must be an array.');
    await expect(engine.processBatch({ eventName: 'x' })).rejects.toThrow('Events must be an array.');
  });
});
