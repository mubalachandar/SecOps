const { threatIntelService } = require('../services/threatIntelService');
const { success } = require('../utils/response');

async function searchCVE(req, res, next) {
  try {
    const { keyword, page = 1, limit = 10, severity } = req.query;
    
    if (!keyword || keyword.length < 3) {
      return res.status(400).json({ success: false, error: { message: 'Keyword must be at least 3 characters long' } });
    }

    const options = {
      resultsPerPage: parseInt(limit, 10),
      startIndex: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      severity
    };
    
    const data = await threatIntelService.searchCVE(keyword, options);
    return success(res, data, 'CVE search results retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function getCVEById(req, res, next) {
  try {
    const { cveId } = req.params;
    const data = await threatIntelService.getCVEById(cveId);
    return success(res, data, 'CVE details retrieved successfully');
  } catch (error) {
    if (error.message.startsWith('CVE not found')) {
      return res.status(404).json({ success: false, error: { message: error.message } });
    }
    if (error.message.startsWith('Invalid CVE ID')) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
    return next(error);
  }
}

async function getKEVCatalog(req, res, next) {
  try {
    const { limit = 20, offset = 0, search } = req.query;
    const options = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      search
    };
    
    const data = await threatIntelService.getKEVCatalog(options);
    return success(res, data, 'KEV catalog retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function getLatestCVEs(req, res, next) {
  try {
    const { severity, daysBack = 7 } = req.query;
    const options = { severity, daysBack: parseInt(daysBack, 10) };
    
    const data = await threatIntelService.getLatestCVEs(options);
    return success(res, data, 'Latest CVEs retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function getCVEStats(req, res, next) {
  try {
    const data = await threatIntelService.getCVEStats();
    return success(res, data, 'CVE stats retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function getEPSSScore(req, res, next) {
  try {
    const { cveId } = req.params;
    const data = await threatIntelService.getEPSSScore(cveId);
    if (!data) {
      return res.status(404).json({ success: false, error: { message: 'EPSS score not found for this CVE' } });
    }
    return success(res, data, 'EPSS score retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function getCompositeScore(req, res, next) {
  try {
    const { cveId } = req.params;
    const data = await threatIntelService.getCompositeScore(cveId);
    return success(res, data, 'Composite score calculated successfully');
  } catch (error) {
    if (error.message.startsWith('CVE not found') || error.message.startsWith('Invalid CVE ID')) {
      return res.status(404).json({ success: false, error: { message: error.message } });
    }
    return next(error);
  }
}

async function searchByAWSService(req, res, next) {
  try {
    const { service } = req.params;
    const data = await threatIntelService.searchByAWSService(service);
    return success(res, data, 'AWS service vulnerabilities retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  searchCVE,
  getCVEById,
  getKEVCatalog,
  getLatestCVEs,
  getCVEStats,
  getEPSSScore,
  getCompositeScore,
  searchByAWSService
};
