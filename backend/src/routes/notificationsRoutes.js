const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/config', notificationsController.getConfig);
router.put('/config/slack', notificationsController.updateSlackConfig);
router.put('/config/email', notificationsController.updateEmailConfig);

router.post('/test/slack', notificationsController.testSlackNotification);
router.post('/test/email', notificationsController.testEmailNotification);

router.get('/logs', notificationsController.getNotificationLogs);
router.get('/stats', notificationsController.getNotificationStats);

module.exports = router;
