const { GoogleGenerativeAI } = require('@google/generative-ai');
const geminiService = require('./geminiService');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class ChatService {
  constructor() {
    this.conversationHistory = new Map();
    this.sessionTimestamps = new Map(); // track last activity for eviction
    this.createChatTable().catch(err => {
      logger.error('Failed to create chat table', { error: err.message });
    });
    // Cleanup stale sessions every hour to prevent memory leak
    this._cleanupInterval = setInterval(() => this._cleanupStaleSessions(), 60 * 60 * 1000);
    if (this._cleanupInterval.unref) this._cleanupInterval.unref(); // don't block process exit
  }

  _cleanupStaleSessions() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    let removed = 0;
    for (const [sessionId, ts] of this.sessionTimestamps.entries()) {
      if (ts < cutoff) {
        this.conversationHistory.delete(sessionId);
        this.sessionTimestamps.delete(sessionId);
        removed++;
      }
    }
    if (removed > 0) logger.info('ChatService: evicted stale sessions', { removed });

    // Hard cap: if still too large, evict oldest entries
    if (this.conversationHistory.size > 1000) {
      const entries = Array.from(this.sessionTimestamps.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, 100);
      for (const [sid] of entries) {
        this.conversationHistory.delete(sid);
        this.sessionTimestamps.delete(sid);
      }
      logger.warn('ChatService: evicted 100 oldest sessions (hard cap)', { remaining: this.conversationHistory.size });
    }
  }


  async createChatTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        user_id UUID REFERENCES users(id),
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        tokens_used INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
    `;
    await query(sql);
  }

  async buildSystemContext() {
    const [alertsResult, rulesResult, eventsResult, recentAlertsResult] = await Promise.all([
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='open') as open, COUNT(*) FILTER (WHERE severity='critical') as critical FROM alerts`),
      query(`SELECT COUNT(*) as active FROM detection_rules WHERE is_active=true`),
      query(`SELECT event_name, COUNT(*) as count FROM cloudtrail_events WHERE event_time >= NOW() - INTERVAL '24 hours' GROUP BY event_name ORDER BY count DESC LIMIT 5`),
      query(`SELECT title, severity, mitre_tactic, created_at FROM alerts WHERE status='open' ORDER BY created_at DESC LIMIT 5`)
    ]);

    const alertsRow = alertsResult.rows[0] || {};
    const totalAlerts = alertsRow.total || 0;
    const openAlerts = alertsRow.open || 0;
    const criticalAlerts = alertsRow.critical || 0;
    const activeRules = rulesResult.rows[0]?.active || 0;

    const topEvents = eventsResult.rows.map(r => `${r.event_name}: ${r.count}`).join(', ');
    const recentAlerts = recentAlertsResult.rows.map(r => `${r.title} (${r.severity} - ${r.mitre_tactic})`).join('\n');

    return `You are SecOps AI, an expert cybersecurity analyst assistant integrated into a Security Operations Center platform. You have real-time access to the current security posture.

CURRENT SECURITY CONTEXT (as of ${new Date().toISOString()}):

Total Alerts: ${totalAlerts} | Open: ${openAlerts} | Critical: ${criticalAlerts}
Active Detection Rules: ${activeRules}
Top Events Last 24h: ${topEvents}
Recent Open Alerts: 
${recentAlerts}

YOUR CAPABILITIES:

- Analyze security alerts and explain what they mean in plain English
- Explain MITRE ATT&CK tactics and techniques in detail
- Recommend investigation steps and remediation actions
- Identify attack patterns and correlations across alerts
- Provide threat intelligence context for IOCs like IPs and event names
- Answer questions about AWS CloudTrail events and their security implications
- Help prioritize alerts based on risk and context
- Explain detection rules and suggest improvements

RESPONSE GUIDELINES:

- Be concise but thorough — SOC analysts are busy
- Use bullet points for action items and recommendations
- Always mention MITRE ATT&CK context when relevant
- Flag if something sounds like a false positive
- Use severity language: CRITICAL, HIGH, MEDIUM, LOW
- Format code and event names in backticks
- End investigation recommendations with a priority score 1-10
- STRICT DOMAIN RESTRICTION: You MUST refuse to answer any questions or requests that are not strictly related to cybersecurity, SecOps, AWS CloudTrail, MITRE ATT&CK, or SOC analysis. If a user asks for general programming help (like reversing a string), general knowledge, or anything outside the security domain, politely decline and state that your assistance is limited to SecOps related inquiries only.`;
  }

  async sendMessage(sessionId, userMessage, userId) {
    let history = this.conversationHistory.get(sessionId) || [];
    
    const systemContext = await this.buildSystemContext();
    const apiKey = process.env.GEMINI_CHAT_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error('Gemini API key is not configured — chat unavailable');
      return { sessionId, userMessage, aiResponse: 'AI chat is unavailable: no Gemini API key is configured. Please set GEMINI_API_KEY in your environment.', tokensUsed: 0, timestamp: new Date().toISOString() };
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemContext }]
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        topP: 0.8
      }
    });

    const chat = model.startChat({ history });
    
    let responseText;
    try {
      // Since we can use a separate API key for chat, bypass the background task rate limiter
      const result = await chat.sendMessage(userMessage);
      responseText = result.response.text();
    } catch (err) {
      logger.error('Gemini chat failed', { error: err.message, stack: err.stack });
      if (err.message.includes('429')) {
        responseText = "My API quota limit has been temporarily reached due to background threat analysis tasks. Please wait about a minute and try again.";
      } else if (err.message.includes('503')) {
        responseText = "The AI model is currently experiencing a temporary spike in high demand (503 Service Unavailable). Please wait a few seconds and try again.";
      } else {
        responseText = "I encountered an internal error connecting to my AI service. Please try again later.";
      }
    }

    history.push({ role: 'user', parts: [{ text: userMessage }] });
    history.push({ role: 'model', parts: [{ text: responseText }] });

    if (history.length > 20) {
      history = history.slice(-20);
    }
    this.conversationHistory.set(sessionId, history);
    this.sessionTimestamps.set(sessionId, Date.now()); // update last activity for LRU eviction

    const tokensUsed = Math.round((systemContext.length + userMessage.length + responseText.length) / 4);

    try {
      await query(
        `INSERT INTO chat_messages (id, session_id, user_id, user_message, ai_response, tokens_used, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [uuidv4(), sessionId, userId, userMessage, responseText, tokensUsed]
      );
    } catch (err) {
      logger.error('Failed to save chat message', { error: err.message });
    }

    return {
      sessionId,
      userMessage,
      aiResponse: responseText,
      tokensUsed,
      timestamp: new Date().toISOString()
    };
  }

  getSessionHistory(sessionId) {
    return this.conversationHistory.get(sessionId) || [];
  }

  clearSession(sessionId) {
    this.conversationHistory.delete(sessionId);
    return true;
  }

  getSuggestedPrompts(context = 'general') {
    if (context === 'alerts') {
      return [
        "What are the most critical alerts I should investigate right now?",
        "Show me the attack chain for the latest critical alert",
        "Explain the current threat landscape based on recent alerts",
        "Are there any correlated alerts happening at the same time?",
        "What's the best remediation for the most recent alert?",
        "Which alert poses the highest business risk?"
      ].slice(0, 6);
    } else if (context === 'rules') {
      return [
        "How can I reduce false positives in my detection rules?",
        "Suggest a new detection rule for ransomware activity",
        "Explain the logic behind the failed login detection rule",
        "What MITRE tactics should I add rules for?",
        "How to detect unauthorized API keys in CloudTrail?",
        "Can you write a rule to detect lateral movement?"
      ].slice(0, 6);
    } else {
      return [
        "What are the most critical alerts I should investigate right now?",
        "Explain the MITRE ATT&CK privilege escalation tactic",
        "How do I investigate a root account login alert?",
        "What does a CloudTrail StopLogging event mean?",
        "Show me the attack chain for the latest critical alert",
        "How can I reduce false positives in my detection rules?",
        "What are signs of lateral movement in CloudTrail logs?",
        "Explain the current threat landscape based on recent alerts"
      ].slice(0, 6);
    }
  }
}

module.exports = { chatService: new ChatService() };
