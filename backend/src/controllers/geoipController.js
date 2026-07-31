const geoipService = require('../services/geoipService');
const { success } = require('../utils/response');

async function getThreatOrigins(req, res, next) {
  try {
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 7);
    
    const startDate = req.query.startDate || defaultStart.toISOString();
    const endDate = req.query.endDate || new Date().toISOString();
    const limit = parseInt(req.query.limit, 10) || 100;
    
    const data = await geoipService.getThreatOrigins(startDate, endDate, limit);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getCountryStats(req, res, next) {
  try {
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 7);
    
    const startDate = req.query.startDate || defaultStart.toISOString();
    const endDate = req.query.endDate || new Date().toISOString();
    
    const data = await geoipService.getCountryStats(startDate, endDate);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getHeatmapData(req, res, next) {
  try {
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 7);
    
    const startDate = req.query.startDate || defaultStart.toISOString();
    const endDate = req.query.endDate || new Date().toISOString();
    
    const data = await geoipService.getHeatmapData(startDate, endDate);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getLiveThreats(req, res, next) {
  try {
    const data = await geoipService.getLiveThreats();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function lookupIP(req, res, next) {
  try {
    const ip = req.params.ip;
    if (!ip) {
      return res.status(400).json({ error: { message: 'IP address is required' }});
    }
    const data = await geoipService.lookupIP(ip);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getThreatOrigins,
  getCountryStats,
  getHeatmapData,
  getLiveThreats,
  lookupIP
};
