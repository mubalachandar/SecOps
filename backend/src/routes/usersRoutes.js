const express = require('express');
const { authenticate } = require('../middleware/auth');
const usersController = require('../controllers/usersController');

const router = express.Router();

router.use(authenticate);

router.get('/profile', usersController.getProfile);
router.put('/profile', usersController.updateProfile);
router.put('/password', usersController.changePassword);
router.get('/audit-logs', usersController.getAuditLogs);

module.exports = router;
