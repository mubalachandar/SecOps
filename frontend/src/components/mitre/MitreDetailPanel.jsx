import React from 'react';
import { X, ExternalLink, AlertTriangle } from 'lucide-react';
import { useMitreTechniqueDetail, useMitreTacticDetail } from '../../hooks/useMitre';
import Badge from '../ui/Badge';

export default function MitreDetailPanel({ selectedItem, type, isOpen, onClose }) {
  const { data: tacticData, isLoading: tacticLoading } = useMitreTacticDetail(
    isOpen && type === 'tactic' ? selectedItem?.id : null
  );

  const { data: detail, isLoading } = useMitreTechniqueDetail(
    isOpen && type === 'technique' ? selectedItem?.id : null
  );

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen && selectedItem ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-[#0e1015] border-l border-[#1f2229] flex flex-col transition-transform duration-300 ease-out ${isOpen && selectedItem ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedItem && (
          <>
            {/* Header */}
            <div className="h-14 shrink-0 border-b border-[#1f2229] px-5 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-[#06b6d4] font-semibold">{selectedItem.id}</span>
                  <a
                    href={`https://attack.mitre.org/techniques/${selectedItem.id?.replace('.', '/')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    attack.mitre.org ↗
                  </a>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">{selectedItem.name}</div>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#191c24] text-slate-500 hover:text-slate-200 transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Alert count */}
              {selectedItem.alertCount > 0 ? (
                <div className="bg-[#f0384a]/8 border border-[#f0384a]/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Active Alerts</div>
                    <div className="text-4xl font-black text-[#f0384a]">{selectedItem.alertCount}</div>
                    {selectedItem.maxSeverity && (
                      <Badge variant={selectedItem.maxSeverity} size="sm" className="mt-2">{selectedItem.maxSeverity}</Badge>
                    )}
                  </div>
                  <AlertTriangle className="w-12 h-12 text-[#f0384a]/20" />
                </div>
              ) : (
                <div className="bg-[#13151b] border border-[#1f2229] rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#191c24] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#2fbf71]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-300">No Active Alerts</div>
                    <div className="text-[11px] text-slate-600">This technique has no coverage gaps</div>
                  </div>
                </div>
              )}

              {/* Description */}
              {(detail?.description || selectedItem.description) && (
                <div className="bg-[#13151b] border border-[#1f2229] rounded-xl p-4">
                  <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-2">Description</div>
                  <p className="text-sm text-slate-400 leading-relaxed">{detail?.description || selectedItem.description}</p>
                </div>
              )}

              {/* Recent alerts */}
              {selectedItem.recentAlerts?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-2 px-1">Recent Alerts</div>
                  <div className="space-y-1">
                    {selectedItem.recentAlerts.slice(0, 5).map((alert, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-[#13151b] border border-[#1f2229] rounded-lg hover:bg-[#191c24] transition-colors">
                        <span className="text-[11px] text-slate-300 truncate flex-1">{alert.title}</span>
                        <Badge variant={alert.severity} size="sm">{alert.severity}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-[#13151b] border border-[#1f2229] rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-3">Recommendations</div>
                <div className="space-y-2">
                  {['Enable CloudTrail logging for all API calls', 'Set up GuardDuty for threat detection', 'Review IAM policies and apply least privilege'].map((rec, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#06b6d4]/10 border border-[#06b6d4]/20 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#06b6d4]" />
                      </div>
                      <span className="text-xs text-slate-500 leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
