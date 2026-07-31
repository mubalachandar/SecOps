const express = require('express');
const { param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/mitreController');

const router = express.Router();

router.use(authenticate);

router.get('/', controller.getMitreMatrix);
router.get('/coverage', controller.getMitreCoverage);

router.get('/tactic/:tacticId', [
  param('tacticId').isString().trim().isLength({ min: 1, max: 20 })
], controller.getMitreTacticDetail);

router.get('/technique/:techniqueId', [
  param('techniqueId').isString().trim().isLength({ min: 1, max: 20 })
], controller.getMitreTechniqueDetail);

module.exports = router;
