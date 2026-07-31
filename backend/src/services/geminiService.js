const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const client = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const model = client ? client.getGenerativeModel({ model: MODEL }) : null;
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const fallback = (summary) => ({ riskScore: 0, severity: 'info', summary, attackChain: '', falsePositiveProbability: 1, iocIndicators: [], immediateActions: [], longTermActions: [], mitreTactics: [], investigationQuestions: [] });

class RequestQueue {
  constructor(delayMs = 10000) {
    this.delayMs = delayMs;
    this.lastRun = 0;
    this.queue = [];
    this.isProcessing = false;
  }

  async add(task, priority = false) {
    return new Promise((resolve, reject) => {
      const item = { task, resolve, reject };
      if (priority) {
        this.queue.unshift(item);
      } else {
        this.queue.push(item);
      }
      this.processNext();
    });
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const { task, resolve, reject } = this.queue.shift();

    const now = Date.now();
    const timeSinceLast = now - this.lastRun;
    if (timeSinceLast < this.delayMs) {
      await wait(this.delayMs - timeSinceLast);
    }

    this.lastRun = Date.now();
    
    try {
      const result = await task();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }
}

const rateLimiter = new RequestQueue(5000);

class GeminiService {
  async analyzeAlert(alert) {
    try {
      if (!model) return fallback('AI analysis is unavailable because Gemini is not configured. Manual analyst review is required.');
      const prompt = `You are an expert SOC analyst. Analyze this security alert and provide a structured assessment.\n\nAlert Details:\n\nTitle: ${alert.title}\nSeverity: ${alert.severity}\nEvent Type: ${alert.event_type}\nSource IP: ${alert.source_ip}\nAffected Resource: ${alert.affected_resource}\nMITRE Tactic: ${alert.mitre_tactic}\nMITRE Technique: ${alert.mitre_technique}\nRaw Event: ${JSON.stringify(alert.raw_event, null, 2)}\nTimestamp: ${alert.timestamp}\n\nProvide your analysis in the following exact JSON format:\n{\n"riskScore": <0-100 integer>,\n"severity": "<critical|high|medium|low>",\n"summary": "<2-3 sentence executive summary>",\n"attackChain": "<describe the likely attack chain>",\n"falsePositiveProbability": <0.0-1.0 float>,\n"iocIndicators": ["<indicator1>", "<indicator2>"],\n"immediateActions": ["<action1>", "<action2>", "<action3>"],\n"longTermActions": ["<action1>", "<action2>"],\n"mitreTactics": ["<tactic1>"],\n"investigationQuestions": ["<question1>", "<question2>"]\n}\n\nRespond ONLY with the JSON object. No markdown, no explanation.`;
      
      const responseText = await rateLimiter.add(() => this._generate(prompt), false);
      return this._normalize(this._parse(responseText));
    } catch (error) {
      logger.error('Gemini alert analysis failed', { alertId: alert?.id, error: error.message });
      return fallback('AI analysis could not be completed due to rate limits or API errors. Manual analyst review is required.');
    }
  }

  async generateThreatSummary(alerts) {
    try {
      if (!model) return { summary: 'Gemini is not configured; no AI threat summary is available.', topThreats: [], trendAnalysis: 'Unavailable.' };
      const prompt = `You are an expert SOC manager. Produce an executive threat brief from these alerts. Return only JSON: {"summary":"string","topThreats":["string"],"trendAnalysis":"string"}.\n${JSON.stringify(alerts, null, 2)}`;
      
      const responseText = await rateLimiter.add(() => this._generate(prompt), false);
      const parsed = this._parse(responseText);
      return { summary: String(parsed.summary || ''), topThreats: Array.isArray(parsed.topThreats) ? parsed.topThreats.map(String) : [], trendAnalysis: String(parsed.trendAnalysis || '') };
    } catch (error) { 
      logger.error('Gemini threat summary failed', { error: error.message }); 
      return { summary: 'Threat summary generation failed due to API limits.', topThreats: [], trendAnalysis: 'Unavailable.' }; 
    }
  }

  async explainMitreTechnique(techniqueId) {
    try {
      if (!model) return { technique: techniqueId, description: 'Gemini is not configured.', defenseRecommendations: [] };
      const prompt = `Explain MITRE ATT&CK technique ${techniqueId} in plain English for a SOC analyst. Return only JSON: {"technique":"string","description":"string","defenseRecommendations":["string"]}.`;
      
      const responseText = await rateLimiter.add(() => this._generate(prompt), true); // higher priority if user requested it
      const parsed = this._parse(responseText);
      return { technique: String(parsed.technique || techniqueId), description: String(parsed.description || ''), defenseRecommendations: Array.isArray(parsed.defenseRecommendations) ? parsed.defenseRecommendations.map(String) : [] };
    } catch (error) { 
      logger.error('MITRE explanation failed', { techniqueId, error: error.message }); 
      return { technique: techniqueId, description: 'Technique explanation is unavailable.', defenseRecommendations: [] }; 
    }
  }
  
  // Method to allow other services to use the rate limiter
  async executeChat(chatSession, userMessage) {
    return rateLimiter.add(async () => {
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const result = await chatSession.sendMessage(userMessage);
          return result.response.text();
        } catch (error) {
          lastError = error;
          const nonRetryable = /\b(429|quota|404|not found|no longer available)\b/i.test(error.message);
          if (nonRetryable || attempt >= 2) break;
          await wait(1000);
        }
      }
      throw lastError;
    }, true); // true = High Priority (goes to front of queue)
  }

  async _generate(prompt) {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt += 1) { 
      try {
        const operation = model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 2048, responseMimeType: 'application/json' } });
        const result = await Promise.race([operation, new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini request timed out')), 15000))]);
        const response = await result.response;
        return response.text();
      } catch (error) {
        lastError = error;
        logger.warn('Gemini request attempt failed', { attempt, error: error.message });
        const nonRetryable = /\b(429|quota|404|not found|no longer available)\b/i.test(error.message);
        if (nonRetryable || attempt >= 3) break;
        await wait(1000);
      }
    }
    throw lastError;
  }

  _parse(text) { 
    try {
      const fenced = String(text).match(/```(?:json)?\s*([\s\S]*?)```/i); 
      const value = fenced ? fenced[1] : String(text).slice(String(text).indexOf('{'), String(text).lastIndexOf('}') + 1); 
      return JSON.parse(value);
    } catch (e) {
      return {};
    }
  }
  
  _normalize(value) {
    const list = (input) => Array.isArray(input) ? input.map(String) : [];
    return { riskScore: Math.max(0, Math.min(100, Math.round(Number(value.riskScore) || 0))), severity: ['critical', 'high', 'medium', 'low', 'info'].includes(String(value.severity).toLowerCase()) ? String(value.severity).toLowerCase() : 'info', summary: String(value.summary || ''), attackChain: String(value.attackChain || ''), falsePositiveProbability: Math.max(0, Math.min(1, Number(value.falsePositiveProbability) || 0)), iocIndicators: list(value.iocIndicators), immediateActions: list(value.immediateActions), longTermActions: list(value.longTermActions), mitreTactics: list(value.mitreTactics), investigationQuestions: list(value.investigationQuestions) };
  }
}

module.exports = new GeminiService();
module.exports.GeminiService = GeminiService;
module.exports.MODEL = MODEL;
