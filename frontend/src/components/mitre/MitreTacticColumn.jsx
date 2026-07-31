import React from 'react';
import MitreCell from './MitreCell';

export default function MitreTacticColumn({ tactic, onTechniqueClick, selectedTechniqueId }) {
  const maxSeverity = tactic.techniques.reduce((max, t) => {
    const order = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
    const techSev = t.alertCount > 0 ? (t.maxSeverity || 'low') : 'none';
    return (order[techSev] || 0) > (order[max] || 0) ? techSev : max;
  }, 'none');

  const headerBg = {
    none: 'bg-[#13151b] border-b border-[#1f2229]',
    low: 'bg-[#06b6d4]/8 border-b border-[#06b6d4]/20',
    medium: 'bg-[#f0c419]/8 border-b border-[#f0c419]/20',
    high: 'bg-[#f5942e]/10 border-b border-[#f5942e]/25',
    critical: 'bg-[#f0384a]/12 border-b border-[#f0384a]/25',
  }[maxSeverity] || 'bg-[#13151b] border-b border-[#1f2229]';

  const headerText = {
    none: 'text-slate-300',
    low: 'text-[#06b6d4]',
    medium: 'text-[#f0c419]',
    high: 'text-[#f5942e]',
    critical: 'text-[#f0384a]',
  }[maxSeverity] || 'text-slate-300';

  const totalAlerts = tactic.techniques.reduce((sum, t) => sum + (t.alertCount || 0), 0);

  return (
    <div className="min-w-[140px] max-w-[160px] flex flex-col">
      {/* Header */}
      <div className={`rounded-t-lg px-2 py-2.5 text-center ${headerBg}`}>
        <div className="font-mono text-[9px] text-slate-600 opacity-70">{tactic.id}</div>
        <div className={`text-[10px] font-bold leading-tight mt-0.5 ${headerText}`}>{tactic.name}</div>
        {totalAlerts > 0 && (
          <div className={`text-[9px] opacity-80 mt-0.5 ${headerText}`}>{totalAlerts} alerts</div>
        )}
      </div>
      {/* Techniques */}
      <div className="flex flex-col gap-1 p-1.5 bg-[#0e1015] rounded-b-lg flex-1">
        {(tactic.techniques || []).map(technique => (
          <MitreCell
            key={technique.id}
            technique={technique}
            isSelected={selectedTechniqueId === technique.id}
            onClick={(t) => onTechniqueClick(t, tactic.id)}
          />
        ))}
      </div>
    </div>
  );
}
