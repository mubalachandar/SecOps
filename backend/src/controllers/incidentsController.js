const { correlationEngine } = require('../services/correlationEngine');
const { success } = require('../utils/response');

async function getIncidents(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      severity: req.query.severity,
      attack_pattern: req.query.attack_pattern
    };
    const pagination = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 12
    };
    
    const result = await correlationEngine.getIncidents(filters, pagination);
    return success(res, result, 'Incidents retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function getIncidentById(req, res, next) {
  try {
    const { incidentId } = req.params;
    const data = await correlationEngine.getIncidentById(incidentId);
    if (!data) {
      const err = new Error('Incident not found');
      err.statusCode = 404;
      throw err;
    }
    return success(res, data, 'Incident retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function getIncidentStats(req, res, next) {
  try {
    const stats = await correlationEngine.getIncidentStats();
    return success(res, stats, 'Incident stats retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function resolveIncident(req, res, next) {
  try {
    const { incidentId } = req.params;
    // Assume req.user.id is populated by authenticate middleware
    const resolvedBy = req.user ? req.user.id : null;
    const data = await correlationEngine.resolveIncident(incidentId, resolvedBy);
    return success(res, data, 'Incident resolved successfully');
  } catch (error) {
    return next(error);
  }
}

async function triggerCorrelation(req, res, next) {
  try {
    const summary = await correlationEngine.correlateAlerts();
    return success(res, summary, 'Correlation triggered successfully');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getIncidents,
  getIncidentById,
  getIncidentStats,
  resolveIncident,
  triggerCorrelation
};
