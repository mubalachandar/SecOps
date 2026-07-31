const { notificationService } = require('../services/notificationService');
const logger = require('../utils/logger');

class NotificationsController {
  async getConfig(req, res, next) {
    try {
      const userId = req.user?.id;
      const slackConfig = await notificationService.getOrCreateConfig(userId, 'slack');
      const emailConfig = await notificationService.getOrCreateConfig(userId, 'email');

      res.json({
        success: true,
        data: {
          slack: slackConfig,
          email: emailConfig
        }
      });
    } catch (err) {
      logger.error('Failed to get notification config', { error: err.message });
      next(err);
    }
  }

  async updateSlackConfig(req, res, next) {
    try {
      const userId = req.user?.id;
      const {
        webhookUrl,
        channel,
        notifyCritical,
        notifyHigh,
        notifyMedium,
        notifyOnIncident,
        isEnabled
      } = req.body;

      const updates = {
        is_enabled: isEnabled,
        config: { webhookUrl, channel },
        notify_critical: notifyCritical,
        notify_high: notifyHigh,
        notify_medium: notifyMedium,
        notify_on_incident: notifyOnIncident
      };

      const updatedConfig = await notificationService.updateConfig(userId, 'slack', updates);

      res.json({
        success: true,
        data: updatedConfig,
        message: 'Slack configuration updated'
      });
    } catch (err) {
      logger.error('Failed to update slack config', { error: err.message });
      next(err);
    }
  }

  async updateEmailConfig(req, res, next) {
    try {
      const userId = req.user?.id;
      const {
        recipients,
        notifyCritical,
        notifyHigh,
        notifyMedium,
        notifyOnIncident,
        isEnabled
      } = req.body;

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validRecipients = (recipients || []).filter(email => emailRegex.test(email));

      const updates = {
        is_enabled: isEnabled,
        config: { recipients: validRecipients },
        notify_critical: notifyCritical,
        notify_high: notifyHigh,
        notify_medium: notifyMedium,
        notify_on_incident: notifyOnIncident
      };

      const updatedConfig = await notificationService.updateConfig(userId, 'email', updates);

      res.json({
        success: true,
        data: updatedConfig,
        message: 'Email configuration updated'
      });
    } catch (err) {
      logger.error('Failed to update email config', { error: err.message });
      next(err);
    }
  }

  async testSlackNotification(req, res, next) {
    try {
      const userId = req.user?.id;
      const result = await notificationService.testNotification(userId, 'slack');
      
      res.json({
        success: result.sent,
        data: result,
        message: result.sent ? 'Test Slack notification sent' : 'Failed to send test notification'
      });
    } catch (err) {
      logger.error('Test slack notification failed', { error: err.message });
      next(err);
    }
  }

  async testEmailNotification(req, res, next) {
    try {
      const userId = req.user?.id;
      const result = await notificationService.testNotification(userId, 'email');
      
      res.json({
        success: result.sent,
        data: result,
        message: result.sent ? 'Test email sent' : 'Failed to send test email'
      });
    } catch (err) {
      logger.error('Test email notification failed', { error: err.message });
      next(err);
    }
  }

  async getNotificationLogs(req, res, next) {
    try {
      const userId = req.user?.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const data = await notificationService.getNotificationLogs(userId, { page, limit });

      res.json({
        success: true,
        data: data.logs,
        pagination: data.pagination
      });
    } catch (err) {
      logger.error('Failed to fetch notification logs', { error: err.message });
      next(err);
    }
  }

  async getNotificationStats(req, res, next) {
    try {
      const stats = await notificationService.getNotificationStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (err) {
      logger.error('Failed to fetch notification stats', { error: err.message });
      next(err);
    }
  }
}

module.exports = new NotificationsController();
