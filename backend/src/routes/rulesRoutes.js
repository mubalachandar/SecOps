const express = require('express');
const { rulesController } = require('../controllers/rulesController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// --- Static routes MUST come before parameterized /:ruleId routes ---

// GET /  — List rules (any authenticated user)
router.get('/', authenticate, (req, res, next) => rulesController.getRules(req, res, next));

// GET /stats  — Rule statistics (any authenticated user)
router.get('/stats', authenticate, (req, res, next) => rulesController.getRuleStats(req, res, next));

// POST /test  — Test a rule against a sample event (admin + analyst)
router.post('/test', authenticate, authorize('admin', 'analyst'), (req, res, next) => rulesController.testRule(req, res, next));

// --- Parameterized routes ---

// GET /:ruleId  — Get single rule (any authenticated user)
router.get('/:ruleId', authenticate, (req, res, next) => rulesController.getRuleById(req, res, next));

// POST /  — Create rule (admin only)
router.post('/', authenticate, authorize('admin'), (req, res, next) => rulesController.createRule(req, res, next));

// PUT /:ruleId  — Update rule (admin only)
router.put('/:ruleId', authenticate, authorize('admin'), (req, res, next) => rulesController.updateRule(req, res, next));

// DELETE /:ruleId  — Delete rule (admin only)
router.delete('/:ruleId', authenticate, authorize('admin'), (req, res, next) => rulesController.deleteRule(req, res, next));

// PUT /:ruleId/toggle  — Toggle rule active state (admin + analyst)
router.put('/:ruleId/toggle', authenticate, authorize('admin', 'analyst'), (req, res, next) => rulesController.toggleRule(req, res, next));

module.exports = router;
