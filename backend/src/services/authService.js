const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { passwordSchema } = require('../utils/validators');
const logger = require('../utils/logger');

function serviceError(message, statusCode, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

class AuthService {
  async register(email, password, fullName, role = 'analyst') {
    try {
      this._validateEmail(email);
      this._validatePasswordStrength(password);
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (existing.rowCount) throw serviceError('An account with this email already exists.', 409, 'EMAIL_ALREADY_EXISTS');
      const passwordHash = await this._hashPassword(password);
      const result = await query(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, full_name, role, created_at`,
        [normalizedEmail, passwordHash, fullName.trim(), role]
      );
      const user = this._publicUser(result.rows[0]);
      await this._writeAuditLog(user.id, 'USER_REGISTERED', 'user', user.id, { email: user.email, role: user.role });
      return { user, token: this._generateToken({ userId: user.id, email: user.email, role: user.role }) };
    } catch (error) {
      logger.warn('User registration failed', { email: typeof email === 'string' ? email.toLowerCase() : null, error: error.message });
      throw error;
    }
  }

  async login(email, password) {
    try {
      this._validateEmail(email);
      const normalizedEmail = email.trim().toLowerCase();
      const result = await query('SELECT id, email, password_hash, full_name, role, is_active, last_login FROM users WHERE email = $1', [normalizedEmail]);
      const record = result.rows[0];
      if (!record) throw serviceError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
      if (!record.is_active) throw serviceError('Account disabled.', 403, 'ACCOUNT_DISABLED');
      if (!(await this._comparePassword(password, record.password_hash))) throw serviceError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
      const updated = await query('UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1 RETURNING id, email, full_name, role, last_login', [record.id]);
      const user = this._publicUser(updated.rows[0]);
      await this._writeAuditLog(user.id, 'USER_LOGIN', 'user', user.id, { email: user.email });
      return { user, token: this._generateToken({ userId: user.id, email: user.email, role: user.role }) };
    } catch (error) {
      logger.warn('User login failed', { email: typeof email === 'string' ? email.toLowerCase() : null, error: error.code || error.message });
      throw error;
    }
  }

  async logout(userId) {
    try {
      await this._writeAuditLog(userId, 'USER_LOGOUT', 'user', userId, {});
      return { message: 'Logged out successfully' };
    } catch (error) { logger.error('User logout audit failed', { userId, error: error.message }); throw error; }
  }

  async getMe(userId) {
    try {
      const result = await query('SELECT id, email, full_name, role, is_active, created_at, updated_at, last_login FROM users WHERE id = $1', [userId]);
      if (!result.rowCount) throw serviceError('User not found.', 404, 'USER_NOT_FOUND');
      return this._publicUser(result.rows[0], true);
    } catch (error) { logger.warn('Get current user failed', { userId, error: error.message }); throw error; }
  }

  async updateProfile(userId, fullName) {
    try {
      const result = await query(
        'UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, full_name, role',
        [fullName.trim(), userId]
      );
      if (!result.rowCount) throw serviceError('User not found.', 404, 'USER_NOT_FOUND');
      const user = this._publicUser(result.rows[0]);
      await this._writeAuditLog(userId, 'PROFILE_UPDATED', 'user', userId, { fullName });
      return { user };
    } catch (error) { logger.warn('Profile update failed', { userId, error: error.message }); throw error; }
  }

  async refreshToken(userId, email, role) {
    try { return { token: this._generateToken({ userId, email, role }) }; }
    catch (error) { logger.error('Token refresh failed', { userId, error: error.message }); throw error; }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const result = await query('SELECT id, password_hash FROM users WHERE id = $1', [userId]);
      if (!result.rowCount) throw serviceError('User not found.', 404, 'USER_NOT_FOUND');
      if (!(await this._comparePassword(currentPassword, result.rows[0].password_hash))) throw serviceError('Current password is incorrect.', 401, 'INVALID_CURRENT_PASSWORD');
      this._validatePasswordStrength(newPassword);
      const passwordHash = await this._hashPassword(newPassword);
      await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, userId]);
      await this._writeAuditLog(userId, 'PASSWORD_CHANGED', 'user', userId, {});
      return { message: 'Password changed successfully' };
    } catch (error) { logger.warn('Password change failed', { userId, error: error.code || error.message }); throw error; }
  }

  _generateToken(payload) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw serviceError('JWT_SECRET must be configured with at least 32 characters.', 500, 'JWT_CONFIGURATION_ERROR');
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h', issuer: 'secops-ai-copilot', audience: 'secops-ai-copilot-api' });
  }
  async _hashPassword(password) { try { return await bcrypt.hash(password, 12); } catch (error) { logger.error('Password hash failed', { error: error.message }); throw error; } }
  async _comparePassword(password, hash) { try { return await bcrypt.compare(password, hash); } catch (error) { logger.error('Password comparison failed', { error: error.message }); throw error; } }
  _validatePasswordStrength(password) { return passwordSchema.parse(password); }
  _validateEmail(email) { if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw serviceError('A valid email address is required.', 400, 'VALIDATION_ERROR'); }
  async _writeAuditLog(userId, action, resourceType, resourceId, details) { await query('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES ($1, $2, $3, $4, $5::jsonb)', [userId, action, resourceType, resourceId, JSON.stringify(details)]); }
  _publicUser(record, includeMetadata = false) {
    const user = { id: record.id, email: record.email, fullName: record.full_name, role: record.role };
    if (record.created_at) user.createdAt = record.created_at;
    if (record.last_login) user.lastLogin = record.last_login;
    if (includeMetadata) { user.isActive = record.is_active; user.updatedAt = record.updated_at; }
    return user;
  }
}

module.exports = new AuthService();
module.exports.AuthService = AuthService;
