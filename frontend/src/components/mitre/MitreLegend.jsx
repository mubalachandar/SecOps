import React from 'react';

export default function MitreLegend({ coveragePercentage = 0 }) {
  const pct = Math.round(coveragePercentage);
  return (
    <div className="flex items-center gap-6 flex-wrap py-3 px-5 bg-[#0e1015] border border-[#1f2229] rounded-xl">
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-wider text-slate-600">Coverage</span>
        <div className="flex items-center gap-2">
          <div className="bg-[#191c24] rounded-full h-1.5 w-24 overflow-hidden">
            <div className="bg-[#06b6d4] rounded-full h-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] font-semibold text-[#06b6d4]">{pct}%</span>
        </div>
      </div>
      <div className="flex items-center gap-4 ml-auto flex-wrap">
        {[
          { label: 'No Coverage', color: 'bg-[#191c24]' },
          { label: 'Low', color: 'bg-[#06b6d4]/60' },
          { label: 'Medium', color: 'bg-[#f0c419]/60' },
          { label: 'High', color: 'bg-[#f5942e]/80' },
          { label: 'Critical', color: 'bg-[#f0384a] animate-pulse' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
            <span className="text-[10px] text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
