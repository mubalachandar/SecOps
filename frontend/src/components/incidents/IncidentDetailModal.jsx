import React from 'react';
import { X } from 'lucide-react';
import { useIncidentById, useResolveIncident } from '../../hooks/useIncidents';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import KillChainVisualizer from './KillChainVisualizer';
import IncidentTimeline from './IncidentTimeline';
import GlowCard from '../ui/GlowCard';

const getRiskColor = (score) => {
  if (score >= 80) return '#f0384a';
  if (score >= 60) return '#f5942e';
  if (score >= 40) return '#f0c419';
  return '#2fbf71';
};

export default function IncidentDetailModal({ incident, isOpen, onClose }) {
  const incidentId = incident?.incident_id || incident?.id;
  const { data: incidentData, isLoading } = useIncidentById(incidentId, { enabled: !!incidentId && isOpen });
  const resolveMutation = useResolveIncident();

  if (!isOpen) return null;

  const displayIncident = incidentData?.incident || incident;
  const timeline = incidentData?.timeline || [];
  const alerts = incidentData?.alerts || displayIncident?.alerts || [];

  if (!displayIncident) return null;

  const riskColor = getRiskColor(displayIncident.risk_score);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#08090c]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0e1015] border-l border-[#1f2229] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="h-14 px-5 border-b border-[#1f2229] flex items-center justify-between bg-[#13151b] shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-slate-600">{displayIncident.incident_id}</span>
            <span className="text-sm font-semibold text-slate-100">{displayIncident.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={displayIncident.status === 'resolved' ? 'resolved' : 'open'} size="sm">
              {displayIncident.status}
            </Badge>
            <span 
              className="font-mono text-[11px] rounded-lg px-2 py-0.5 border"
              style={{ color: riskColor, backgroundColor: `${riskColor}1A`, borderColor: `${riskColor}33` }}
            >
              Risk {displayIncident.risk_score}
            </span>
            {displayIncident.status !== 'resolved' && (
              <Button 
                variant="danger" 
                size="sm" 
                onClick={() => resolveMutation.mutate(displayIncident.incident_id, { onSuccess: onClose })}
                isLoading={resolveMutation.isPending || resolveMutation.isLoading}
              >
                Resolve
              </Button>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#191c24] rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {isLoading && !incidentData ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#06b6d4]" />
            </div>
          ) : (
            <>
              <KillChainVisualizer 
                activePhase={displayIncident.kill_chain_phase} 
                attackPattern={displayIncident.attack_pattern} 
              />

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="bg-[#13151b] border border-[#1f2229] rounded-xl p-4">
                  <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Incident Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Severity</span><span className="text-slate-200 capitalize">{displayIncident.severity}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="text-slate-200 capitalize">{displayIncident.status}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Alert Count</span><span className="text-slate-200">{displayIncident.alert_count}</span></div>
                    {displayIncident.first_seen && <div className="flex justify-between"><span className="text-slate-500">First Seen</span><span className="text-slate-200 text-xs">{new Date(displayIncident.first_seen).toLocaleString()}</span></div>}
                    {displayIncident.last_seen && <div className="flex justify-between"><span className="text-slate-500">Last Seen</span><span className="text-slate-200 text-xs">{new Date(displayIncident.last_seen).toLocaleString()}</span></div>}
                  </div>
                </div>
                <div className="bg-[#13151b] border border-[#1f2229] rounded-xl p-4">
                  <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Scope</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-500 text-xs block mb-1">Affected Resources</span>
                      {displayIncident.affected_resources?.length > 0 ? (
                        displayIncident.affected_resources.map((res, i) => (
                          <div key={i} className="text-sm text-slate-300 break-all">{res}</div>
                        ))
                      ) : <span className="text-slate-600 text-sm">None identified</span>}
                    </div>
                    {displayIncident.mitre_tactics?.length > 0 && (
                      <div>
                        <span className="text-slate-500 text-xs block mb-1">MITRE Tactics</span>
                        <div className="flex flex-wrap gap-1">
                          {displayIncident.mitre_tactics.map((t, i) => (
                            <span key={i} className="bg-[#191c24] border border-[#2a2e38] text-[10px] text-slate-300 px-2 py-0.5 rounded-md">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <GlowCard glow={displayIncident.risk_score >= 70 ? 'critical' : 'accent'}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Risk Score</div>
                    <div className="text-5xl font-black" style={{ color: riskColor }}>{displayIncident.risk_score}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                    {displayIncident.description || 'This incident represents a correlated set of security events that require investigation.'}
                  </div>
                </div>
              </GlowCard>

              {alerts && alerts.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Correlated Alerts</h3>
                  <div className="space-y-1">
                    {alerts.slice(0, 8).map((alert, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-[#13151b] border border-[#1f2229] rounded-lg hover:bg-[#191c24] transition-colors">
                        <Badge variant={alert.severity || 'low'} size="sm" className="w-16 justify-center">
                          {alert.severity || 'low'}
                        </Badge>
                        <span className="text-sm text-slate-200 truncate flex-1">{alert.title}</span>
                      </div>
                    ))}
                    {alerts.length > 8 && (
                      <div className="text-xs text-slate-500 text-center py-2">
                        + {alerts.length - 8} more alerts
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2">
                 <IncidentTimeline timeline={timeline} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
