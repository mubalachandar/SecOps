const express = require('express');
const router = express.Router();
const incidentsController = require('../controllers/incidentsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, incidentsController.getIncidents);
router.get('/stats', authenticate, incidentsController.getIncidentStats);
router.get('/:incidentId', authenticate, incidentsController.getIncidentById);
router.put('/:incidentId/resolve', authenticate, authorize(['admin', 'analyst']), incidentsController.resolveIncident);
router.post('/correlate', authenticate, authorize(['admin']), incidentsController.triggerCorrelation);

module.exports = router;
