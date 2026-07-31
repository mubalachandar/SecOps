const { chatService } = require('../services/chatService');
const { v4: uuidv4 } = require('uuid');

exports.sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || message.length > 2000) {
      return res.status(400).json({ success: false, error: 'Message is required and must be under 2000 characters' });
    }
    
    const sid = sessionId || 'session-' + uuidv4();
    const result = await chatService.sendMessage(sid, message, req.user.id);
    
    return res.status(200).json({
      success: true,
      data: {
        sessionId: sid,
        message: result.aiResponse,
        userMessage: message,
        tokensUsed: result.tokensUsed,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const history = chatService.getSessionHistory(sessionId);
    
    const formatted = history.map(h => ({
      role: h.role === 'model' ? 'assistant' : h.role,
      content: h.parts[0].text,
      timestamp: new Date().toISOString()
    }));
    
    return res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

exports.clearSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    chatService.clearSession(sessionId);
    return res.status(200).json({ success: true, message: 'Session cleared' });
  } catch (error) {
    next(error);
  }
};

exports.getSuggestedPrompts = async (req, res, next) => {
  try {
    const context = req.query.context || 'general';
    const prompts = chatService.getSuggestedPrompts(context);
    return res.status(200).json({ success: true, data: prompts });
  } catch (error) {
    next(error);
  }
};
