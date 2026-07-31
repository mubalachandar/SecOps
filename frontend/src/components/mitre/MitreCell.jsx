import React from 'react';

const severityStyles = {
  none: 'bg-[#13151b] border-transparent text-slate-700 hover:border-[#2a2e38]',
  low: 'bg-[#06b6d4]/10 border-[#06b6d4]/20 text-[#06b6d4] hover:bg-[#06b6d4]/15',
  medium: 'bg-[#f0c419]/15 border-[#f0c419]/25 text-[#f0c419] hover:bg-[#f0c419]/20',
  high: 'bg-[#f5942e]/20 border-[#f5942e]/30 text-[#f5942e] hover:bg-[#f5942e]/25',
  critical: 'bg-[#f0384a]/20 border-[#f0384a]/30 text-[#f0384a] hover:bg-[#f0384a]/25',
};

export default function MitreCell({ technique, isSelected, onClick }) {
  const alertCount = technique.alertCount || 0;
  const severity = alertCount === 0 ? 'none' : (technique.maxSeverity || 'low');
  const styles = severityStyles[severity] || severityStyles.none;

  return (
    <button
      onClick={() => onClick && onClick(technique)}
      className={`w-full rounded-lg p-2 cursor-pointer transition-all duration-150 min-h-[56px] flex flex-col justify-between relative overflow-hidden border ${
        isSelected ? 'ring-2 ring-[#06b6d4] ring-offset-1 ring-offset-[#08090c] ' : ''
      }${styles}`}
    >
      {severity === 'critical' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(240,56,74,0.06), transparent)',
            animation: 'shimmer 2s infinite'
          }}
        />
      )}
      <div className="font-mono text-[9px] opacity-60 text-left leading-none">{technique.id}</div>
      <div className="text-[10px] font-medium leading-tight line-clamp-2 text-left mt-1">{technique.name}</div>
      {alertCount > 0 && (
        <div className="absolute top-1 right-1 bg-current/20 text-current text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center">
          {alertCount > 9 ? '9+' : alertCount}
        </div>
      )}
    </button>
  );
}
