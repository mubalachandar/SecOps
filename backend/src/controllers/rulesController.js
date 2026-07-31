const { rulesService } = require('../services/rulesService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low'];

class RulesController {
  async getRules(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      if (page < 1) {
        return error(res, 'Page must be >= 1', 400);
      }
      if (limit > 100) {
        return error(res, 'Limit cannot exceed 100', 400);
      }

      const filters = {};

      if (req.query.severity) {
        filters.severity = req.query.severity;
      }
      if (req.query.mitreTactic) {
        filters.mitreTactic = req.query.mitreTactic;
      }
      if (req.query.search) {
        filters.search = req.query.search;
      }
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }

      const result = await rulesService.getRules(filters, { page, limit });
      const { rules, total } = result;
      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        success: true,
        data: rules,
        pagination: { total, page, limit, totalPages },
        message: 'Rules retrieved successfully'
      });
    } catch (err) {
      logger.error('RulesController.getRules failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }

  async getRuleStats(req, res, next) {
    try {
      const stats = await rulesService.getRuleStats();

      return res.status(200).json({
        success: true,
        data: stats,
        message: 'Rule statistics retrieved'
      });
    } catch (err) {
      logger.error('RulesController.getRuleStats failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }

  async getRuleById(req, res, next) {
    try {
      const { ruleId } = req.params;

      if (!UUID_REGEX.test(ruleId)) {
        return error(res, 'Invalid rule ID format', 400);
      }

      const rule = await rulesService.getRuleById(ruleId);

      return res.status(200).json({
        success: true,
        data: rule,
        message: 'Rule retrieved successfully'
      });
    } catch (err) {
      if (err.message === 'Rule not found') {
        return error(res, 'Rule not found', 404);
      }
      logger.error('RulesController.getRuleById failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }

  async createRule(req, res, next) {
    try {
      const { name, description, severity, mitre_tactic, mitre_technique, event_patterns } = req.body;

      // Validation
      if (!name || typeof name !== 'string') {
        return error(res, 'Validation failed: name is required and must be a string', 400);
      }
      if (name.length < 3 || name.length > 100) {
        return error(res, 'Validation failed: name must be between 3 and 100 characters', 400);
      }
      if (!description || typeof description !== 'string') {
        return error(res, 'Validation failed: description is required and must be a string', 400);
      }
      if (description.length < 10 || description.length > 500) {
        return error(res, 'Validation failed: description must be between 10 and 500 characters', 400);
      }
      if (!severity || !VALID_SEVERITIES.includes(severity)) {
        return error(res, 'Validation failed: severity must be one of critical, high, medium, low', 400);
      }
      if (!mitre_tactic || typeof mitre_tactic !== 'string') {
        return error(res, 'Validation failed: mitre_tactic is required and must be a string', 400);
      }
      if (!mitre_technique || typeof mitre_technique !== 'string') {
        return error(res, 'Validation failed: mitre_technique is required and must be a string', 400);
      }
      if (!event_patterns || typeof event_patterns !== 'object' || event_patterns === null || Array.isArray(event_patterns)) {
        return error(res, 'Validation failed: event_patterns is required and must be a JSON object', 400);
      }

      const rule = await rulesService.createRule(req.body, req.user.id);

      return res.status(201).json({
        success: true,
        data: rule,
        message: 'Detection rule created successfully'
      });
    } catch (err) {
      logger.error('RulesController.createRule failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }

  async updateRule(req, res, next) {
    try {
      const { ruleId } = req.params;

      if (!UUID_REGEX.test(ruleId)) {
        return error(res, 'Invalid rule ID format', 400);
      }

      const updateKeys = Object.keys(req.body);
      if (updateKeys.length === 0) {
        return error(res, 'No update fields provided', 400);
      }

      if (req.body.severity !== undefined && !VALID_SEVERITIES.includes(req.body.severity)) {
        return error(res, 'Validation failed: severity must be one of critical, high, medium, low', 400);
      }
      if (req.body.event_patterns !== undefined) {
        if (typeof req.body.event_patterns !== 'object' || req.body.event_patterns === null || Array.isArray(req.body.event_patterns)) {
          return error(res, 'Validation failed: event_patterns must be a JSON object', 400);
        }
      }

      const updatedRule = await rulesService.updateRule(ruleId, req.body, req.user.id);

      return res.status(200).json({
        success: true,
        data: updatedRule,
        message: 'Rule updated successfully'
      });
    } catch (err) {
      if (err.message === 'Rule not found') {
        return error(res, 'Rule not found', 404);
      }
      logger.error('RulesController.updateRule failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }

  async deleteRule(req, res, next) {
    try {
      const { ruleId } = req.params;

      if (!UUID_REGEX.test(ruleId)) {
        return error(res, 'Invalid rule ID format', 400);
      }

      await rulesService.deleteRule(ruleId, req.user.id);

      return res.status(200).json({
        success: true,
        data: null,
        message: 'Rule deleted successfully'
      });
    } catch (err) {
      if (err.message === 'Rule not found') {
        return error(res, 'Rule not found', 404);
      }
      logger.error('RulesController.deleteRule failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }

  async toggleRule(req, res, next) {
    try {
      const { ruleId } = req.params;
      const { isActive } = req.body;

      if (!UUID_REGEX.test(ruleId)) {
        return error(res, 'Invalid rule ID format', 400);
      }

      if (typeof isActive !== 'boolean') {
        return error(res, 'isActive must be a boolean', 400);
      }

      const updatedRule = await rulesService.toggleRule(ruleId, isActive, req.user.id);

      return res.status(200).json({
        success: true,
        data: updatedRule,
        message: `Rule ${isActive ? 'enabled' : 'disabled'} successfully`
      });
    } catch (err) {
      logger.error('RulesController.toggleRule failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }

  async testRule(req, res, next) {
    try {
      const { ruleData, sampleEvent } = req.body;

      if (!ruleData || typeof ruleData !== 'object' || !ruleData.event_patterns) {
        return error(res, 'Both ruleData and sampleEvent are required', 400);
      }
      if (!sampleEvent || typeof sampleEvent !== 'object' || !sampleEvent.eventName) {
        return error(res, 'Both ruleData and sampleEvent are required', 400);
      }

      const result = await rulesService.testRule(ruleData, sampleEvent);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Rule test completed'
      });
    } catch (err) {
      logger.error('RulesController.testRule failed', {
        error: err.message,
        userId: req.user?.id
      });
      next(err);
    }
  }
}

module.exports = { rulesController: new RulesController() };
