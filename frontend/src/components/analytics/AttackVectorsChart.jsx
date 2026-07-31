import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';
import Card from '../ui/Card';

export default function AttackVectorsChart({ data, isLoading }) {
  const tooltipStyle = { backgroundColor: '#13151b', border: '1px solid #2a2e38', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };

  return (
    <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl overflow-hidden h-full">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-slate-100">Attack Vectors</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">By MITRE tactic</p>
      </div>
      <div className="px-5 pb-5 h-full">
        {isLoading ? (
          <div className="h-[288px] flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
          </div>
        ) : (
          <div style={{ height: 288 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="tactic" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(6,182,212,0.06)' }} />
                <Bar dataKey="alertCount" fill="#06b6d4" radius={[0, 3, 3, 0]} maxBarSize={20} name="Alerts" />
                <Bar dataKey="highSeverityCount" fill="#f0384a" radius={[0, 3, 3, 0]} maxBarSize={20} name="High/Critical" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
