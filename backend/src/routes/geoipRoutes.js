const express = require('express');
const router = express.Router();
const controller = require('../controllers/geoipController');
const { authenticate } = require('../middleware/auth');

router.get('/threat-origins', authenticate, controller.getThreatOrigins);
router.get('/country-stats', authenticate, controller.getCountryStats);
router.get('/heatmap', authenticate, controller.getHeatmapData);
router.get('/live', authenticate, controller.getLiveThreats);
router.get('/lookup/:ip', authenticate, controller.lookupIP);

module.exports = router;
