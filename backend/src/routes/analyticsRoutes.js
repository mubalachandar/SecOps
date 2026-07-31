const express = require('express');
const { analyticsController } = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication

router.get('/dashboard', authenticate, (req, res, next) =>
  analyticsController.getDashboardStats(req, res, next)
);

router.get('/trend', authenticate, (req, res, next) =>
  analyticsController.getAlertTrend(req, res, next)
);

router.get('/severity', authenticate, (req, res, next) =>
  analyticsController.getSeverityDistribution(req, res, next)
);

router.get('/attack-vectors', authenticate, (req, res, next) =>
  analyticsController.getTopAttackVectors(req, res, next)
);

router.get('/geographic', authenticate, (req, res, next) =>
  analyticsController.getGeographicDistribution(req, res, next)
);

router.get('/top-ips', authenticate, (req, res, next) =>
  analyticsController.getTopSourceIPs(req, res, next)
);

router.get('/health', authenticate, (req, res, next) =>
  analyticsController.getSystemHealth(req, res, next)
);

router.get('/mttr', authenticate, (req, res, next) =>
  analyticsController.getMTTR(req, res, next)
);

router.get('/risk-timeline', authenticate, (req, res, next) =>
  analyticsController.getRiskScoreTimeline(req, res, next)
);

router.get('/incident-burndown', authenticate, (req, res, next) =>
  analyticsController.getIncidentBurndown(req, res, next)
);

module.exports = router;
