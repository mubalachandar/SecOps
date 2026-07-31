const { validationResult } = require('express-validator');
const alertService = require('../services/alertService');
const { success } = require('../utils/response');
function validate(req) { const result = validationResult(req); if (!result.isEmpty()) throw Object.assign(new Error('Request validation failed.'), { statusCode: 400, code: 'VALIDATION_ERROR', details: result.array({ onlyFirstError: true }) }); }
async function getAlerts(req, res, next) { try { validate(req); return success(res, await alertService.getAlerts(req.query, req.query), 'Alerts retrieved successfully'); } catch (error) { return next(error); } }
async function getAlertById(req, res, next) { try { validate(req); return success(res, await alertService.getAlertById(req.params.id), 'Alert retrieved successfully'); } catch (error) { return next(error); } }
async function updateAlertStatus(req, res, next) { try { validate(req); return success(res, await alertService.updateAlertStatus(req.params.id, req.body.status, req.user.id, req.body.notes), 'Alert status updated successfully'); } catch (error) { return next(error); } }
async function getAlertAnalysis(req, res, next) { try { validate(req); return success(res, await alertService.getAlertAnalysis(req.params.id), 'Alert analysis retrieved successfully'); } catch (error) { return next(error); } }
async function triggerAIAnalysis(req, res, next) { try { validate(req); return success(res, await alertService.triggerAIAnalysis(req.params.id), 'AI analysis completed successfully'); } catch (error) { return next(error); } }
async function bulkUpdateStatus(req, res, next) { try { validate(req); return success(res, await alertService.bulkUpdateStatus(req.body.alertIds, req.body.status, req.user.id), 'Bulk alert status update completed'); } catch (error) { return next(error); } }
async function getAlertStats(req, res, next) { try { validate(req); return success(res, await alertService.getAlertStats(), 'Alert statistics retrieved successfully'); } catch (error) { return next(error); } }
module.exports = { getAlerts, getAlertById, updateAlertStatus, getAlertAnalysis, triggerAIAnalysis, bulkUpdateStatus, getAlertStats };
