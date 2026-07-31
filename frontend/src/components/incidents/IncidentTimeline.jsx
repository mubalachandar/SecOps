import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const sevIcon = { critical: AlertTriangle, high: AlertCircle, medium: Info, low: Info };
const sevColors = { critical: '#f0384a', high: '#f5942e', medium: '#f0c419', low: '#06b6d4' };

export default function IncidentTimeline({ timeline = [], alerts = [] }) {
  const data = timeline.length > 0 ? timeline : alerts;
  if (!data || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at));

  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-3 px-1">Timeline</div>
      <div className="relative space-y-0">
        {/* Vertical line */}
        <div className="absolute left-3.5 top-4 bottom-4 w-px bg-[#1f2229]" />
        {sorted.map((item, idx) => {
          const severity = item.severity || 'low';
          const Icon = sevIcon[severity] || Info;
          const color = sevColors[severity] || '#64748b';
          return (
            <div key={item.id || idx} className="flex gap-4 relative pb-0">
              <div
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-[#08090c] mt-2"
                style={{ borderColor: color }}
              >
                <Icon className="w-3 h-3" style={{ color }} />
              </div>
              <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl p-3.5 flex-1 mb-3">
                {idx === 0 && (
                  <span className="bg-[#f0384a]/10 text-[#f0384a] text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mb-1">MOST RECENT</span>
                )}
                <div className="text-[10px] text-slate-600 mb-0.5">
                  {item.timestamp || item.created_at ? formatDistanceToNow(new Date(item.timestamp || item.created_at), { addSuffix: true }) : '—'}
                </div>
                <div className="text-sm font-medium text-slate-200">{item.title || item.description || item.action}</div>
                {item.alert_id && (
                  <span className="text-[11px] text-[#06b6d4] mt-1 inline-block font-mono">{item.alert_id}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
