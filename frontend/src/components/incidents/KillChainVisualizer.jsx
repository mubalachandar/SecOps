import React from 'react';
import { Shield, Eye, Lock, Terminal, UserCheck, Download } from 'lucide-react';

const KILL_CHAIN_PHASES = [
  { id: 'reconnaissance', label: 'Recon', icon: Eye },
  { id: 'initial_access', label: 'Access', icon: Lock },
  { id: 'execution', label: 'Execution', icon: Terminal },
  { id: 'privilege_escalation', label: 'Escalation', icon: UserCheck },
  { id: 'defense_evasion', label: 'Evasion', icon: Shield },
  { id: 'exfiltration', label: 'Exfiltration', icon: Download },
];

export default function KillChainVisualizer({ activePhase, attackPattern }) {
  const activeIndex = KILL_CHAIN_PHASES.findIndex(
    p => p.id === activePhase || p.id === activePhase?.toLowerCase()?.replace(/\s+/g, '_')
  );

  return (
    <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cyber Kill Chain</span>
        {attackPattern && (
          <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-mono px-2 py-0.5 rounded-lg">
            {attackPattern.replace(/_/g, ' ')}
          </span>
        )}
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-1 min-w-max">
          {KILL_CHAIN_PHASES.map((phase, idx) => {
            const Icon = phase.icon;
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;
            return (
              <React.Fragment key={phase.id}>
                <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                  <div
                    className={`w-16 h-12 rounded-xl flex flex-col items-center justify-center text-center transition-all border-2 relative ${
                      isActive
                        ? 'bg-[#f0384a]/15 border-[#f0384a] text-[#f0384a] shadow-lg'
                        : isPast
                        ? 'bg-[#13151b] border-[#2a2e38] text-slate-400'
                        : 'bg-[#0e1015] border-[#1f2229] text-slate-700'
                    }`}
                    style={isActive ? { boxShadow: '0 0 20px rgba(240,56,74,0.2)' } : {}}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[9px] font-medium mt-0.5 leading-tight px-1">{phase.label}</span>
                  </div>
                  {isActive && (
                    <span className="bg-[#f0384a] text-white text-[8px] font-bold px-2 py-0.5 rounded-full">CURRENT</span>
                  )}
                </div>
                {idx < KILL_CHAIN_PHASES.length - 1 && (
                  <span className={`text-sm mx-0.5 ${ isPast || isActive ? 'text-[#2a2e38]' : 'text-[#1f2229]' }`}>→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
