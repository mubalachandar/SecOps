import React from 'react';

export default function ReportPreview() {
  return (
    <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl p-5">
      <div className="text-sm font-semibold text-slate-100 mb-4">Report Preview</div>
      {/* Mini A4 mockup */}
      <div className="max-w-[180px] mx-auto bg-[#05060a] border border-[#1f2229] rounded-xl overflow-hidden" style={{ aspectRatio: '0.707' }}>
        {/* Header bar */}
        <div className="h-8 bg-[#f0384a] flex items-center justify-between px-3">
          <span className="text-[7px] text-white/70 font-bold tracking-wider">SECOPS AI COPILOT</span>
          <svg className="w-3 h-3 text-white/70" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
        </div>
        {/* Body */}
        <div className="p-3 space-y-2">
          <div className="text-[6px] text-white font-bold tracking-wider">SECURITY OPERATIONS</div>
          <div className="text-[6px] text-slate-400 tracking-wider">REPORT</div>
          <div className="w-full h-px bg-[#06b6d4]/40 mt-1" />
          {/* Mock metrics */}
          <div className="grid grid-cols-2 gap-1 mt-2">
            {[['#f0384a', '24'], ['#f5942e', '8'], ['#f0c419', '156'], ['#2fbf71', '99%']].map(([color, val], i) => (
              <div key={i} className="bg-[#13151b] rounded p-1.5 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <div className="h-1.5 bg-[#191c24] rounded flex-1" />
                <span className="text-[6px] text-slate-500">{val}</span>
              </div>
            ))}
          </div>
          {/* Mock chart */}
          <div className="flex items-end gap-0.5 h-8 mt-2">
            {[40, 70, 50, 90, 65, 80, 55].map((h, i) => (
              <div key={i} className="flex-1 bg-[#06b6d4]/40 rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="h-1.5 bg-[#191c24] rounded w-full mt-2" />
          <div className="h-1.5 bg-[#191c24] rounded w-3/4" />
        </div>
        {/* Footer */}
        <div className="h-5 bg-[#13151b] flex items-center justify-between px-3">
          <div className="h-1 bg-[#2a2e38] rounded w-16" />
          <div className="h-1 bg-[#2a2e38] rounded w-8" />
        </div>
      </div>
      <p className="text-[10px] text-slate-600 text-center mt-3 max-w-[180px] mx-auto leading-relaxed">
        Professional PDF with executive summary, MITRE coverage, and AI recommendations
      </p>
    </div>
  );
}
