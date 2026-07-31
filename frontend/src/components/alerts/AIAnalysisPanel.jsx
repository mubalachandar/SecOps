import React from 'react';
import { Zap } from 'lucide-react';
import { useAlertAnalysis, useTriggerAnalysis } from '../../hooks/useAlerts';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';

export default function AIAnalysisPanel({ alertId, onClose }) {
  const { data: analysis, isLoading: isQueryLoading } = useAlertAnalysis(alertId);
  const triggerAnalysis = useTriggerAnalysis();

  const handleTrigger = () => {
    triggerAnalysis.mutate(alertId);
  };

  const isLoading = isQueryLoading || triggerAnalysis.isPending;

  return (
    <Card title="🤖 AI Security Analysis" padding="md">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8">
          <Spinner size="lg" color="slate" />
          <p className="text-slate-400 text-sm mt-4">Gemini AI is analyzing this alert...</p>
        </div>
      ) : !analysis ? (
        <div className="flex flex-col items-center justify-center p-6">
          <Zap className="text-slate-600 w-10 h-10 mb-4" />
          <p className="text-slate-400 text-sm mb-4">No AI analysis available</p>
          <Button onClick={handleTrigger} isLoading={triggerAnalysis.isPending}>
            Run AI Analysis
          </Button>
        </div>
      ) : (
        <div>
          {/* SECTION 1 — Risk Score Banner */}
          <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl mb-4">
            <div className="flex flex-col items-center justify-center min-w-[80px]">
              <div className={`text-4xl font-bold ${
                analysis.riskScore <= 30 ? 'text-green-400' :
                analysis.riskScore <= 60 ? 'text-amber-400' :
                analysis.riskScore <= 80 ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {analysis.riskScore}
              </div>
              <div className="text-slate-500 text-xs mt-1">Risk Score</div>
            </div>
            <div>
              <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
              <div className="text-slate-500 text-xs mt-2">
                FP Probability: {((analysis.falsePositiveProbability || 0) * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* SECTION 2 — Attack Chain */}
          {analysis.attackChain && (
            <div className="mb-4">
              <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Attack Chain</h4>
              <p className="text-slate-300 text-sm bg-slate-800 p-3 rounded-lg leading-relaxed">
                {analysis.attackChain}
              </p>
            </div>
          )}

          {/* SECTION 3 — Immediate Actions */}
          {analysis.immediateActions && analysis.immediateActions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-red-400 text-xs uppercase tracking-wider mb-2">⚡ Immediate Actions</h4>
              {(analysis.immediateActions ?? []).map((action, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <span className="text-red-500 font-bold text-sm">{i + 1}.</span>
                  <p className="text-slate-300 text-sm">{action}</p>
                </div>
              ))}
            </div>
          )}

          {/* SECTION 4 — IOC Indicators */}
          {analysis.iocIndicators && analysis.iocIndicators.length > 0 && (
            <div className="mb-4">
              <h4 className="text-amber-400 text-xs uppercase tracking-wider mb-2">🔍 IOC Indicators</h4>
              <div className="flex flex-wrap gap-2">
                {(analysis.iocIndicators ?? []).map((ioc, i) => (
                  <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded font-mono border border-amber-500/20">
                    {ioc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5 — Investigation Questions */}
          {analysis.investigationQuestions && analysis.investigationQuestions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-blue-400 text-xs uppercase tracking-wider mb-2">❓ Investigation Questions</h4>
              {(analysis.investigationQuestions ?? []).map((q, i) => (
                <p key={i} className="text-slate-400 text-xs mb-1">• {q}</p>
              ))}
            </div>
          )}

          {/* SECTION 6 — Long Term Actions */}
          {analysis.longTermActions && analysis.longTermActions.length > 0 && (
            <div>
              <h4 className="text-green-400 text-xs uppercase tracking-wider mb-2">🛡️ Long-term Remediation</h4>
              {(analysis.longTermActions ?? []).map((action, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <span className="text-green-500">✓</span>
                  <p className="text-slate-300 text-sm">{action}</p>
                </div>
              ))}
            </div>
          )}

          {/* FOOTER */}
          <div className="border-t border-slate-800 pt-4 mt-4 flex justify-between items-center">
            <span className="text-slate-600 text-xs">Powered by Gemini 1.5 Flash</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleTrigger}
              isLoading={triggerAnalysis.isPending}
            >
              Refresh Analysis
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
