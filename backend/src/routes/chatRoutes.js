const express = require('express');
const { authenticate } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

const router = express.Router();

router.use(authenticate);

router.post('/send', chatController.sendMessage);
router.get('/history/:sessionId', chatController.getHistory);
router.delete('/session/:sessionId', chatController.clearSession);
router.get('/suggested-prompts', chatController.getSuggestedPrompts);

module.exports = router;
