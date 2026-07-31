const { validationResult } = require('express-validator');
const cloudtrailService = require('../services/cloudtrailService');
const detectionEngine = require('../services/detectionEngine');
const { success, paginated } = require('../utils/response');

function validate(req) { const result = validationResult(req); if (!result.isEmpty()) throw Object.assign(new Error('Request validation failed.'), { statusCode: 400, code: 'VALIDATION_ERROR', details: result.array({ onlyFirstError: true }) }); }
async function getEvents(req, res, next) { try { validate(req); const page = Number(req.query.page || 1); const limit = Number(req.query.limit || 20); const result = await cloudtrailService.getRecentEvents(limit, (page - 1) * limit, req.query); return paginated(res, result.events, result.total, page, result.limit); } catch (error) { return next(error); } }
async function getEventStats(req, res, next) { try { validate(req); return success(res, await cloudtrailService.getEventStats(req.query.startDate, req.query.endDate), 'CloudTrail statistics retrieved successfully'); } catch (error) { return next(error); } }
async function ingestEvents(req, res, next) { try { validate(req); const result = await cloudtrailService.ingestFromPayload(req.body.events); return success(res, result, 'CloudTrail events ingested successfully', 201); } catch (error) { return next(error); } }
async function simulateAttack(req, res, next) { try { validate(req); const events = await cloudtrailService.simulateCloudTrailEvents(req.body.scenarioName); const result = await cloudtrailService.ingestFromPayload(events); return success(res, { scenarioName: req.body.scenarioName, ...result }, 'Attack scenario simulated successfully', 201); } catch (error) { return next(error); } }
async function getEngineStats(req, res, next) { try { validate(req); return success(res, await detectionEngine.getEngineStats(), 'Detection engine statistics retrieved successfully'); } catch (error) { return next(error); } }
module.exports = { getEvents, getEventStats, ingestEvents, simulateAttack, getEngineStats };
