import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';

export default function GeographicChart({ data, isLoading }) {
  const tooltipStyle = { backgroundColor: '#13151b', border: '1px solid #2a2e38', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };

  return (
    <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl overflow-hidden h-full">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-slate-100">AWS Regions</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">Event distribution by region</p>
      </div>
      <div className="px-5 pb-5">
        {isLoading ? (
          <div className="h-[288px] flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
          </div>
        ) : (
          <div style={{ height: 288 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, bottom: 30, left: 0 }}>
                <XAxis dataKey="region" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(6,182,212,0.06)' }} />
                <Bar dataKey="eventCount" fill="#06b6d4" radius={[3, 3, 0, 0]} maxBarSize={32} name="Events" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
