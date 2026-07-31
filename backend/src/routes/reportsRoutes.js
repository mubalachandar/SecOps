const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, controller.generateReport);
router.get('/', authenticate, controller.getReports);
router.get('/:reportId/download', authenticate, controller.downloadReport);
router.delete('/:reportId', authenticate, controller.deleteReport);

module.exports = router;
