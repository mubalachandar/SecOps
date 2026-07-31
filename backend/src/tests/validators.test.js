'use strict';

// ===========================================================================
// Unit tests for validators.js — Zod schemas and regex patterns.
// No mocking required — all pure functions.
// ===========================================================================

const {
  passwordStrength,
  passwordSchema,
  registerSchema,
  loginSchema,
  changePasswordSchema,
  paginationSchema,
  validate
} = require('../utils/validators');

// ---------------------------------------------------------------------------
// passwordStrength regex
// ---------------------------------------------------------------------------
describe('passwordStrength regex', () => {
  test('matches a strong password with uppercase, number, and special char', () => {
    expect(passwordStrength.test('StrongPass1!')).toBe(true);
  });

  test('matches password with exactly 8 characters', () => {
    expect(passwordStrength.test('Abcde1!!')).toBe(true); // 8 chars
  });

  test('matches password with 128 characters', () => {
    const longPass = 'A1!' + 'a'.repeat(125); // 128 total
    expect(passwordStrength.test(longPass)).toBe(true);
  });

  test('rejects password with no uppercase letter', () => {
    expect(passwordStrength.test('weakpass1!')).toBe(false);
  });

  test('rejects password with no number', () => {
    expect(passwordStrength.test('WeakPassword!')).toBe(false);
  });

  test('rejects password with no special character', () => {
    expect(passwordStrength.test('WeakPass123')).toBe(false);
  });

  test('rejects password shorter than 8 characters', () => {
    expect(passwordStrength.test('Ab1!')).toBe(false);
  });

  test('rejects password longer than 128 characters', () => {
    const tooLong = 'A1!' + 'a'.repeat(126); // 129 total
    expect(passwordStrength.test(tooLong)).toBe(false);
  });

  test('rejects empty string', () => {
    expect(passwordStrength.test('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// passwordSchema (Zod)
// ---------------------------------------------------------------------------
describe('passwordSchema', () => {
  test('parses a valid strong password', () => {
    expect(() => passwordSchema.parse('StrongPass1!')).not.toThrow();
    expect(passwordSchema.parse('StrongPass1!')).toBe('StrongPass1!');
  });

  test('throws ZodError for weak password', () => {
    expect(() => passwordSchema.parse('weakpassword')).toThrow();
  });

  test('error message contains guidance', () => {
    try {
      passwordSchema.parse('weak');
    } catch (e) {
      expect(e.errors[0].message).toMatch(/uppercase|Password/i);
    }
  });
});

// ---------------------------------------------------------------------------
// registerSchema
// ---------------------------------------------------------------------------
describe('registerSchema', () => {
  const validInput = {
    email: 'Alice@Example.COM',
    password: 'SecurePass1!',
    fullName: 'Alice Smith',
    role: 'analyst'
  };

  test('parses a valid registration input', () => {
    const result = registerSchema.parse(validInput);
    expect(result.email).toBe('alice@example.com'); // normalized lowercase
    expect(result.fullName).toBe('Alice Smith');
    expect(result.role).toBe('analyst');
  });

  test('transforms email to lowercase', () => {
    const result = registerSchema.parse(validInput);
    expect(result.email).toBe('alice@example.com');
  });

  test('defaults role to analyst when not provided', () => {
    const input = { ...validInput };
    delete input.role;
    const result = registerSchema.parse(input);
    expect(result.role).toBe('analyst');
  });

  test('accepts admin role', () => {
    const result = registerSchema.parse({ ...validInput, role: 'admin' });
    expect(result.role).toBe('admin');
  });

  test('accepts viewer role', () => {
    const result = registerSchema.parse({ ...validInput, role: 'viewer' });
    expect(result.role).toBe('viewer');
  });

  test('throws for invalid role', () => {
    expect(() => registerSchema.parse({ ...validInput, role: 'superadmin' })).toThrow();
  });

  test('throws for invalid email', () => {
    expect(() => registerSchema.parse({ ...validInput, email: 'not-an-email' })).toThrow();
  });

  test('throws for email longer than 255 chars', () => {
    const longEmail = 'a'.repeat(250) + '@x.com';
    expect(() => registerSchema.parse({ ...validInput, email: longEmail })).toThrow();
  });

  test('throws for fullName shorter than 2 chars', () => {
    expect(() => registerSchema.parse({ ...validInput, fullName: 'A' })).toThrow();
  });

  test('throws for fullName longer than 50 chars', () => {
    expect(() => registerSchema.parse({ ...validInput, fullName: 'A'.repeat(51) })).toThrow();
  });

  test('trims whitespace from fullName', () => {
    const result = registerSchema.parse({ ...validInput, fullName: '  Alice  ' });
    expect(result.fullName).toBe('Alice');
  });

  test('throws for weak password', () => {
    expect(() => registerSchema.parse({ ...validInput, password: 'weak' })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
describe('loginSchema', () => {
  test('parses valid login credentials', () => {
    const result = loginSchema.parse({ email: 'user@example.com', password: 'any-password' });
    expect(result.email).toBe('user@example.com');
  });

  test('normalizes email to lowercase', () => {
    const result = loginSchema.parse({ email: 'USER@EXAMPLE.COM', password: 'pass' });
    expect(result.email).toBe('user@example.com');
  });

  test('throws for invalid email', () => {
    expect(() => loginSchema.parse({ email: 'bad', password: 'pass' })).toThrow();
  });

  test('throws for empty password', () => {
    expect(() => loginSchema.parse({ email: 'u@e.com', password: '' })).toThrow();
  });

  test('throws for password longer than 128 chars', () => {
    expect(() => loginSchema.parse({ email: 'u@e.com', password: 'A'.repeat(129) })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// changePasswordSchema
// ---------------------------------------------------------------------------
describe('changePasswordSchema', () => {
  test('parses matching new password and confirmation', () => {
    const input = {
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass1!',
      confirmNewPassword: 'NewPass1!'
    };
    expect(() => changePasswordSchema.parse(input)).not.toThrow();
  });

  test('throws when newPassword and confirmNewPassword do not match', () => {
    const input = {
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass1!',
      confirmNewPassword: 'DifferentPass1!'
    };
    try {
      changePasswordSchema.parse(input);
      fail('should have thrown');
    } catch (e) {
      const hasConfirmError = e.errors.some(err =>
        err.path.includes('confirmNewPassword') || err.message.includes('confirmation')
      );
      expect(hasConfirmError).toBe(true);
    }
  });

  test('throws for weak new password', () => {
    const input = {
      currentPassword: 'OldPass1!',
      newPassword: 'weak',
      confirmNewPassword: 'weak'
    };
    expect(() => changePasswordSchema.parse(input)).toThrow();
  });

  test('throws for empty current password', () => {
    const input = {
      currentPassword: '',
      newPassword: 'NewPass1!',
      confirmNewPassword: 'NewPass1!'
    };
    expect(() => changePasswordSchema.parse(input)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// paginationSchema
// ---------------------------------------------------------------------------
describe('paginationSchema', () => {
  test('uses sensible defaults when no input provided', () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sortOrder).toBe('desc');
  });

  test('coerces string numbers to integers', () => {
    const result = paginationSchema.parse({ page: '3', limit: '50' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  test('rejects limit > 100', () => {
    expect(() => paginationSchema.parse({ limit: 200 })).toThrow();
  });

  test('rejects page < 1', () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow();
    expect(() => paginationSchema.parse({ page: -1 })).toThrow();
  });

  test('accepts asc sort order', () => {
    const result = paginationSchema.parse({ sortOrder: 'asc' });
    expect(result.sortOrder).toBe('asc');
  });

  test('throws for invalid sortOrder', () => {
    expect(() => paginationSchema.parse({ sortOrder: 'RANDOM' })).toThrow();
  });

  test('accepts optional sortBy', () => {
    const result = paginationSchema.parse({ sortBy: 'createdAt' });
    expect(result.sortBy).toBe('createdAt');
  });

  test('sortBy is undefined when not provided', () => {
    const result = paginationSchema.parse({});
    expect(result.sortBy).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// validate middleware factory
// ---------------------------------------------------------------------------
describe('validate middleware', () => {
  test('calls next() with no args when schema validates successfully', () => {
    const schema = loginSchema;
    const middleware = validate(schema);

    const req = { query: {}, body: { email: 'user@example.com', password: 'pass' } };
    const res = {};
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(); // called with no error argument
    expect(req.validated).toBeDefined();
    expect(req.validated.email).toBe('user@example.com');
  });

  test('calls next(error) when schema validation fails', () => {
    const schema = loginSchema;
    const middleware = validate(schema);

    const req = { query: {}, body: { email: 'bad-email', password: '' } };
    const res = {};
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('merges query and body for validation', () => {
    const schema = paginationSchema;
    const middleware = validate(schema);

    const req = { query: { page: '2', limit: '10' }, body: {} };
    const res = {};
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(); // no error
    expect(req.validated.page).toBe(2);
    expect(req.validated.limit).toBe(10);
  });
});
