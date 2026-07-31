const { reportService } = require('../services/reportService');
const { success } = require('../utils/response');
const fs = require('fs');

async function generateReport(req, res, next) {
  try {
    const { title, reportType, periodStart, periodEnd } = req.body;
    
    if (!title || !reportType || !periodStart || !periodEnd) {
      return res.status(400).json({ error: { message: 'Missing required fields' }});
    }

    const data = await reportService.generateReport({ title, reportType, periodStart, periodEnd }, req.user.id);
    return success(res, data, 'Report generated successfully', 201);
  } catch (error) {
    return next(error);
  }
}

async function getReports(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const data = await reportService.getReports(req.user.id, { page, limit });
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}

async function downloadReport(req, res, next) {
  try {
    const { reportId } = req.params;

    // Security: prevent path traversal — reportId must be alphanumeric/dash/uppercase only
    if (!/^[A-Z0-9\-]+$/.test(reportId)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REPORT_ID', message: 'Invalid report ID format.' } });
    }

    const reportMeta = await reportService.downloadReport(reportId, req.user.id);

    // Security: validate the resolved path stays inside the reports directory
    const path = require('path');
    const reportsBaseDir = path.resolve(__dirname, '../reports');
    const resolvedPath = path.resolve(reportMeta.filePath);
    if (!resolvedPath.startsWith(reportsBaseDir + path.sep) && resolvedPath !== reportsBaseDir) {
      return res.status(403).json({ success: false, error: { code: 'ACCESS_DENIED', message: 'Access denied.' } });
    }

    // Security: only allow PDF files
    if (path.extname(resolvedPath).toLowerCase() !== '.pdf') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_FILE_TYPE', message: 'Only PDF reports can be downloaded.' } });
    }

    res.setHeader('Content-Type', reportMeta.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${reportMeta.fileName}"`);
    
    const fileStream = fs.createReadStream(resolvedPath);
    fileStream.pipe(res);
  } catch (error) {
    return next(error);
  }
}

async function deleteReport(req, res, next) {
  try {
    const { reportId } = req.params;
    const data = await reportService.deleteReport(reportId, req.user.id);
    return success(res, data, 'Report deleted successfully');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  generateReport,
  getReports,
  downloadReport,
  deleteReport
};
