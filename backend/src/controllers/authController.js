const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const { success, created } = require('../utils/response');

function assertValidRequest(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Request validation failed.');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    error.details = errors.array({ onlyFirstError: true });
    throw error;
  }
}

async function register(req, res, next) {
  try { assertValidRequest(req); const data = await authService.register(req.body.email, req.body.password, req.body.fullName, req.body.role); return created(res, data, 'User registered successfully'); }
  catch (error) { return next(error); }
}
async function login(req, res, next) {
  try { assertValidRequest(req); const data = await authService.login(req.body.email, req.body.password); return success(res, data, 'Logged in successfully'); }
  catch (error) { return next(error); }
}
async function logout(req, res, next) {
  try { assertValidRequest(req); const data = await authService.logout(req.user.id); return success(res, data, data.message); }
  catch (error) { return next(error); }
}
async function getMe(req, res, next) {
  try { assertValidRequest(req); const data = await authService.getMe(req.user.id); return success(res, data, 'Current user retrieved successfully'); }
  catch (error) { return next(error); }
}
async function refreshToken(req, res, next) {
  try { assertValidRequest(req); const data = await authService.refreshToken(req.user.id, req.user.email, req.user.role); return success(res, data, 'Token refreshed successfully'); }
  catch (error) { return next(error); }
}
async function changePassword(req, res, next) {
  try { assertValidRequest(req); const data = await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword); return success(res, data, data.message); }
  catch (error) { return next(error); }
}
async function updateProfile(req, res, next) {
  try { assertValidRequest(req); const data = await authService.updateProfile(req.user.id, req.body.fullName); return success(res, data, 'Profile updated successfully'); }
  catch (error) { return next(error); }
}

module.exports = { register, login, logout, getMe, refreshToken, changePassword, updateProfile };
