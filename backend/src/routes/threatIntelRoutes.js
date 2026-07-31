const express = require('express');
const router = express.Router();
const threatIntelController = require('../controllers/threatIntelController');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for threat intel API since it hits external APIs
const threatIntelLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: { message: 'Too many requests to Threat Intel API, please try again later.' } }
});

router.use(authenticate);
router.use(threatIntelLimiter);

router.get('/cve/search', threatIntelController.searchCVE);
router.get('/cve/latest', threatIntelController.getLatestCVEs);
router.get('/cve/stats', threatIntelController.getCVEStats);
router.get('/cve/aws/:service', threatIntelController.searchByAWSService);
router.get('/cve/:cveId', threatIntelController.getCVEById);
router.get('/cve/:cveId/epss', threatIntelController.getEPSSScore);
router.get('/cve/:cveId/composite', threatIntelController.getCompositeScore);

router.get('/kev', threatIntelController.getKEVCatalog);

module.exports = router;
