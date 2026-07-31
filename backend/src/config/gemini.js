const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const generativeAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const model = generativeAI ? generativeAI.getGenerativeModel({ model: modelName }) : null;
const emptyAnalysis = (message) => ({ riskScore: 0, severity: 'info', summary: message, attackChain: [], recommendedActions: [], falsePositiveProbability: 1, mitreTactics: [], iocIndicators: [], immediateActions: [], longTermActions: [] });

function normalizeAnalysis(value) {
  const riskScore = Math.max(0, Math.min(100, Number(value.riskScore) || 0));
  const probability = Math.max(0, Math.min(1, Number(value.falsePositiveProbability) || 0));
  const list = (item) => Array.isArray(item) ? item.map(String) : [];
  return {
    riskScore, severity: ['critical', 'high', 'medium', 'low', 'info'].includes(String(value.severity).toLowerCase()) ? String(value.severity).toLowerCase() : 'info',
    summary: String(value.summary || 'No summary returned by the AI model.'), attackChain: list(value.attackChain), recommendedActions: list(value.recommendedActions),
    falsePositiveProbability: probability, mitreTactics: list(value.mitreTactics), iocIndicators: list(value.iocIndicators), immediateActions: list(value.immediateActions), longTermActions: list(value.longTermActions)
  };
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  return JSON.parse(candidate);
}

async function analyzeAlert(alertData) {
  if (!model) { logger.warn('Gemini analysis skipped because GEMINI_API_KEY is not configured'); return emptyAnalysis('AI analysis is unavailable because Gemini is not configured.'); }
  const prompt = `You are a principal SOC analyst. Analyze the following security alert using evidence only. Identify likely MITRE ATT&CK behavior, IOCs, attack progression, false-positive likelihood, and prioritized containment and remediation steps. Return ONLY valid JSON with exactly these keys: riskScore (number 0-100), severity (critical|high|medium|low|info), summary (string), attackChain (string[]), recommendedActions (string[]), falsePositiveProbability (number 0-1), mitreTactics (string[]), iocIndicators (string[]), immediateActions (string[]), longTermActions (string[]).\n\nAlert data:\n${JSON.stringify(alertData, null, 2)}`;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 2048, responseMimeType: 'application/json' } });
      const response = await result.response;
      return normalizeAnalysis(extractJson(response.text()));
    } catch (error) {
      lastError = error;
      logger.warn('Gemini alert analysis attempt failed', { attempt, error: error.message });
      const nonRetryable = /\b(429|quota|404|not found|no longer available)\b/i.test(error.message);
      if (!nonRetryable && attempt < 3) await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** (attempt - 1))));
      if (nonRetryable) break;
    }
  }
  logger.error('Gemini alert analysis failed after retries', { error: lastError?.message });
  return emptyAnalysis('AI analysis could not be completed. Escalate this alert for manual analyst review.');
}

module.exports = { analyzeAlert, modelName };
