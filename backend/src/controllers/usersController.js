const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

exports.getProfile = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, full_name, email, role, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { full_name } = req.body;
    if (!full_name || full_name.length < 2 || full_name.length > 50) {
      return res.status(400).json({ error: { message: 'Full name must be between 2 and 50 characters' } });
    }
    const { rows } = await query(
      'UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, role, created_at, last_login',
      [full_name, req.user.id]
    );
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: { message: 'Current and new password required' } });
    }
    
    // Validate strength: min 8 chars, 1 uppercase, 1 number, 1 special char
    const strongRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!strongRegex.test(newPassword)) {
      return res.status(400).json({ error: { message: 'Password must be at least 8 chars, 1 uppercase, 1 number, 1 special char' } });
    }

    const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: { message: 'User not found' } });

    const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: { message: 'Invalid current password' } });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    
    await query('BEGIN');
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashed, req.user.id]);
    await query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'PASSWORD_CHANGED', JSON.stringify({ ip: req.ip })]
    );
    await query('COMMIT');

    res.json({ data: { message: 'Password updated successfully' } });
  } catch (err) {
    try { await query('ROLLBACK'); } catch (e) {}
    next(err);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
};
