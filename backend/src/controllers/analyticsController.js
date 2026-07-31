const { analyticsService } = require('../services/analyticsService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

class AnalyticsController {
  async getDashboardStats(req, res, next) {
    try {
      const stats = await analyticsService.getDashboardStats();
      return res.status(200).json({
        success: true,
        data: stats,
        message: 'Dashboard statistics retrieved'
      });
    } catch (err) {
      logger.error('AnalyticsController.getDashboardStats failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }

  async getAlertTrend(req, res, next) {
    try {
      let days = parseInt(req.query.days, 10);
      if (isNaN(days)) days = 30;
      if (days < 1) days = 1;
      if (days > 365) days = 365;

      const trend = await analyticsService.getAlertTrend(days);
      return res.status(200).json({
        success: true,
        data: trend,
        message: 'Alert trend retrieved'
      });
    } catch (err) {
      logger.error('AnalyticsController.getAlertTrend failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }

  async getSeverityDistribution(req, res, next) {
    try {
      const distribution = await analyticsService.getSeverityDistribution();
      return res.status(200).json({
        success: true,
        data: distribution,
        message: 'Severity distribution retrieved'
      });
    } catch (err) {
      logger.error('AnalyticsController.getSeverityDistribution failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }

  async getTopAttackVectors(req, res, next) {
    try {
      const vectors = await analyticsService.getTopAttackVectors();
      return res.status(200).json({
        success: true,
        data: vectors,
        message: 'Top attack vectors retrieved'
      });
    } catch (err) {
      logger.error('AnalyticsController.getTopAttackVectors failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }

  async getGeographicDistribution(req, res, next) {
    try {
      const distribution = await analyticsService.getGeographicDistribution();
      return res.status(200).json({
        success: true,
        data: distribution,
        message: 'Geographic distribution retrieved'
      });
    } catch (err) {
      logger.error('AnalyticsController.getGeographicDistribution failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }

  async getTopSourceIPs(req, res, next) {
    try {
      let limit = parseInt(req.query.limit, 10);
      if (isNaN(limit)) limit = 10;
      if (limit < 5) limit = 5;
      if (limit > 50) limit = 50;

      const ips = await analyticsService.getTopSourceIPs(limit);
      return res.status(200).json({
        success: true,
        data: ips,
        message: 'Top source IPs retrieved'
      });
    } catch (err) {
      logger.error('AnalyticsController.getTopSourceIPs failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }

  async getSystemHealth(req, res, next) {
    try {
      const health = await analyticsService.getSystemHealth();
      return res.status(200).json({
        success: true,
        data: health,
        message: 'System health check completed'
      });
    } catch (err) {
      logger.error('AnalyticsController.getSystemHealth failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }

  async getMTTR(req, res, next) {
    try {
      let days = parseInt(req.query.days, 10);
      if (isNaN(days)) days = 30;
      if (days < 1) days = 1;
      if (days > 365) days = 365;

      const mttr = await analyticsService.getMTTR(days);
      return res.status(200).json({
        success: true,
        data: mttr,
        message: 'MTTR metrics retrieved'
      });
    } catch (err) {
      logger.error('AnalyticsController.getMTTR failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }
  async getRiskScoreTimeline(req, res, next) {
    try {
      const timeline = await analyticsService.getRiskScoreTimeline();
      return res.status(200).json({
        success: true,
        data: timeline,
        message: 'Risk score timeline retrieved'
      });
    } catch (err) {
      logger.error('AnalyticsController.getRiskScoreTimeline failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }

  async getIncidentBurndown(req, res, next) {
    try {
      const burndown = await analyticsService.getIncidentBurndown();
      return res.status(200).json({
        success: true,
        data: burndown,
        message: 'Incident burndown retrieved'
      });
    } catch (err) {
      logger.error('AnalyticsController.getIncidentBurndown failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }
}

module.exports = { analyticsController: new AnalyticsController() };
