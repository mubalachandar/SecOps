'use strict';

// ===========================================================================
// Unit tests for AuthService — business logic with mocked DB and Redis.
// ===========================================================================

// Set required env vars before any module is loaded
process.env.JWT_SECRET = 'super-secret-key-that-is-at-least-32-chars-long!!';
process.env.JWT_EXPIRES_IN = '1h';

// Mock all I/O dependencies
const mockQuery = jest.fn();
jest.mock('../config/database', () => ({
  query: mockQuery,
  pool: null
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AuthService } = require('../services/authService');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeService() {
  return new AuthService();
}

async function hashPassword(pwd) {
  return bcrypt.hash(pwd, 4); // cost 4 for speed in tests
}

function stubUser(overrides = {}) {
  return {
    id: 1,
    email: 'alice@example.com',
    full_name: 'Alice Smith',
    role: 'analyst',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// _validateEmail
// ---------------------------------------------------------------------------
describe('AuthService._validateEmail', () => {
  let service;
  beforeEach(() => { service = makeService(); });

  test('accepts a valid email', () => {
    expect(() => service._validateEmail('user@example.com')).not.toThrow();
  });

  test('accepts email with subdomain', () => {
    expect(() => service._validateEmail('u@mail.co.uk')).not.toThrow();
  });

  test('throws for email with no @', () => {
    expect(() => service._validateEmail('notanemail')).toThrow('A valid email address is required.');
  });

  test('throws for email with no domain part', () => {
    expect(() => service._validateEmail('user@')).toThrow();
  });

  test('throws for non-string input', () => {
    expect(() => service._validateEmail(null)).toThrow();
    expect(() => service._validateEmail(42)).toThrow();
    expect(() => service._validateEmail(undefined)).toThrow();
  });

  test('throws for email with spaces', () => {
    expect(() => service._validateEmail('user @example.com')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// _validatePasswordStrength
// ---------------------------------------------------------------------------
describe('AuthService._validatePasswordStrength', () => {
  let service;
  beforeEach(() => { service = makeService(); });

  test('accepts a strong password', () => {
    expect(() => service._validatePasswordStrength('StrongPass1!')).not.toThrow();
  });

  test('accepts minimum-viable strong password (8 chars)', () => {
    expect(() => service._validatePasswordStrength('Abcdef1!')).not.toThrow();
  });

  test('throws when password has no uppercase letter', () => {
    expect(() => service._validatePasswordStrength('weakpass1!')).toThrow();
  });

  test('throws when password has no number', () => {
    expect(() => service._validatePasswordStrength('WeakPassword!')).toThrow();
  });

  test('throws when password has no special character', () => {
    expect(() => service._validatePasswordStrength('WeakPass123')).toThrow();
  });

  test('throws when password is too short (< 8 chars)', () => {
    expect(() => service._validatePasswordStrength('Ab1!')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// _generateToken
// ---------------------------------------------------------------------------
describe('AuthService._generateToken', () => {
  let service;
  beforeEach(() => { service = makeService(); });

  test('generates a valid JWT with correct claims', () => {
    const payload = { userId: 42, email: 'test@example.com', role: 'admin' };
    const token = service._generateToken(payload);
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'secops-ai-copilot',
      audience: 'secops-ai-copilot-api'
    });
    expect(decoded.userId).toBe(42);
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.role).toBe('admin');
    expect(decoded.iss).toBe('secops-ai-copilot');
    expect(decoded.aud).toBe('secops-ai-copilot-api');
  });

  test('throws when JWT_SECRET is missing', () => {
    const originalSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    expect(() => service._generateToken({ userId: 1 })).toThrow('JWT_SECRET must be configured');
    process.env.JWT_SECRET = originalSecret;
  });

  test('throws when JWT_SECRET is too short (< 32 chars)', () => {
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'short';
    expect(() => service._generateToken({ userId: 1 })).toThrow('JWT_SECRET must be configured with at least 32 characters');
    process.env.JWT_SECRET = originalSecret;
  });

  test('token expires (contains exp claim)', () => {
    const token = service._generateToken({ userId: 1 });
    const decoded = jwt.decode(token);
    expect(decoded.exp).toBeDefined();
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});

// ---------------------------------------------------------------------------
// _hashPassword / _comparePassword
// ---------------------------------------------------------------------------
describe('AuthService password hashing', () => {
  let service;
  beforeEach(() => { service = makeService(); });

  test('hashes a password to a bcrypt string', async () => {
    const hash = await service._hashPassword('MyPassword1!');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  test('comparePassword returns true for matching password', async () => {
    const hash = await service._hashPassword('MyPassword1!');
    const result = await service._comparePassword('MyPassword1!', hash);
    expect(result).toBe(true);
  });

  test('comparePassword returns false for wrong password', async () => {
    const hash = await service._hashPassword('MyPassword1!');
    const result = await service._comparePassword('WrongPassword1!', hash);
    expect(result).toBe(false);
  });

  test('hashes are unique (salted)', async () => {
    const h1 = await service._hashPassword('SamePassword1!');
    const h2 = await service._hashPassword('SamePassword1!');
    expect(h1).not.toBe(h2);
  });
});

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------
describe('AuthService.register', () => {
  let service;

  beforeEach(() => {
    service = makeService();
    mockQuery.mockReset();
  });

  test('registers a new user and returns user + token', async () => {
    const passwordHash = await hashPassword('SecurePass1!');
    // First call: SELECT for duplicate check → empty
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // Second call: INSERT user → returns user
    mockQuery.mockResolvedValueOnce({
      rows: [stubUser({ id: 5, email: 'new@example.com' })],
      rowCount: 1
    });
    // Third call: INSERT audit_log
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const result = await service.register('new@example.com', 'SecurePass1!', 'New User', 'analyst');
    expect(result.user.email).toBe('new@example.com');
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
  });

  test('throws 409 when email already exists', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }); // duplicate found
    await expect(
      service.register('existing@example.com', 'SecurePass1!', 'Existing', 'analyst')
    ).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_ALREADY_EXISTS' });
  });

  test('throws for invalid email format', async () => {
    await expect(
      service.register('not-an-email', 'SecurePass1!', 'Bad', 'analyst')
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws for weak password', async () => {
    await expect(
      service.register('good@example.com', 'weak', 'Name', 'analyst')
    ).rejects.toThrow();
  });

  test('normalizes email to lowercase', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    mockQuery.mockResolvedValueOnce({ rows: [stubUser({ email: 'alice@example.com' })], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    await service.register('ALICE@EXAMPLE.COM', 'SecurePass1!', 'Alice', 'analyst');
    // First query should have normalized email
    expect(mockQuery.mock.calls[0][1][0]).toBe('alice@example.com');
  });
});

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------
describe('AuthService.login', () => {
  let service;

  beforeEach(() => {
    service = makeService();
    mockQuery.mockReset();
  });

  test('returns user and token on correct credentials', async () => {
    const passwordHash = await hashPassword('CorrectPass1!');
    const user = stubUser({ password_hash: passwordHash, is_active: true });
    mockQuery.mockResolvedValueOnce({ rows: [user], rowCount: 1 }); // SELECT user
    mockQuery.mockResolvedValueOnce({ rows: [user], rowCount: 1 }); // UPDATE last_login
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }); // INSERT audit_log

    const result = await service.login('alice@example.com', 'CorrectPass1!');
    expect(result.user.email).toBe('alice@example.com');
    expect(result.token).toBeDefined();
  });

  test('throws 401 when user not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    await expect(service.login('nobody@example.com', 'Pass1!')).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS'
    });
  });

  test('throws 401 when password is wrong', async () => {
    const passwordHash = await hashPassword('RealPassword1!');
    mockQuery.mockResolvedValueOnce({ rows: [stubUser({ password_hash: passwordHash })], rowCount: 1 });
    await expect(service.login('alice@example.com', 'WrongPassword1!')).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS'
    });
  });

  test('throws 403 when account is inactive', async () => {
    const passwordHash = await hashPassword('Pass1!');
    mockQuery.mockResolvedValueOnce({ rows: [stubUser({ password_hash: passwordHash, is_active: false })], rowCount: 1 });
    await expect(service.login('alice@example.com', 'Pass1!')).rejects.toMatchObject({
      statusCode: 403,
      code: 'ACCOUNT_DISABLED'
    });
  });

  test('normalizes email to lowercase before lookup', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    await service.login('ALICE@EXAMPLE.COM', 'Pass1!').catch(() => {});
    expect(mockQuery.mock.calls[0][1][0]).toBe('alice@example.com');
  });
});

// ---------------------------------------------------------------------------
// changePassword
// ---------------------------------------------------------------------------
describe('AuthService.changePassword', () => {
  let service;

  beforeEach(() => {
    service = makeService();
    mockQuery.mockReset();
  });

  test('changes password successfully with correct current password', async () => {
    const currentHash = await hashPassword('CurrentPass1!');
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, password_hash: currentHash }], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }); // audit

    const result = await service.changePassword(1, 'CurrentPass1!', 'NewPass1!');
    expect(result.message).toBe('Password changed successfully');
  });

  test('throws 401 when current password is wrong', async () => {
    const currentHash = await hashPassword('CorrectPassword1!');
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, password_hash: currentHash }], rowCount: 1 });
    await expect(service.changePassword(1, 'WrongPassword1!', 'NewPass1!')).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CURRENT_PASSWORD'
    });
  });

  test('throws when user not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    await expect(service.changePassword(999, 'Pass1!', 'NewPass1!')).rejects.toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND'
    });
  });

  test('throws when new password is weak', async () => {
    const currentHash = await hashPassword('CurrentPass1!');
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, password_hash: currentHash }], rowCount: 1 });
    await expect(service.changePassword(1, 'CurrentPass1!', 'weakpassword')).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// refreshToken
// ---------------------------------------------------------------------------
describe('AuthService.refreshToken', () => {
  let service;
  beforeEach(() => { service = makeService(); });

  test('returns a new JWT token', async () => {
    const result = await service.refreshToken(1, 'alice@example.com', 'admin');
    expect(result.token).toBeDefined();
    const decoded = jwt.decode(result.token);
    expect(decoded.userId).toBe(1);
    expect(decoded.email).toBe('alice@example.com');
    expect(decoded.role).toBe('admin');
  });
});
