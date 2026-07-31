import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import Card from '../ui/Card';

export default function AlertTrendChart({ data, isLoading, days, onDaysChange }) {
  const skeletonBars = Array.from({ length: 14 }).map((_, i) => (
    <div
      key={i}
      className="w-full bg-[var(--bg-surface-2)] rounded-t-sm animate-pulse"
      style={{ height: `${Math.max(20, Math.random() * 100)}%` }}
    />
  ));

  const formatTick = (tickItem) => {
    try {
      if (typeof tickItem === 'string' && tickItem.includes('-')) {
        return format(parseISO(tickItem), 'MMM d');
      }
      return tickItem;
    } catch {
      return tickItem;
    }
  };

  const headerAction = (
    <div className="bg-[var(--bg-surface-2)] rounded-lg p-1 border border-[var(--border-color)] flex">
      <button
        onClick={() => onDaysChange?.(7)}
        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
          days === 7
            ? 'bg-accent text-white shadow-lg shadow-accent/20'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
      >
        7D
      </button>
      <button
        onClick={() => onDaysChange?.(30)}
        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
          days === 30
            ? 'bg-accent text-white shadow-lg shadow-accent/20'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
      >
        30D
      </button>
    </div>
  );

  return (
    <Card title="Alert Trend" headerAction={headerAction} padding="md" className="h-full">
      {isLoading ? (
        <div className="w-full h-[300px] flex items-end gap-1 px-4 pb-12 pt-8">
          {skeletonBars}
        </div>
      ) : (
        <>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }} 
                  tickFormatter={formatTick}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }} 
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#13151b',
                    border: '1px solid #2a2e38',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ color: '#9ca3b0', marginBottom: '8px', fontWeight: 600 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#06b6d4" 
                  fill="url(#colorTotal)" 
                  strokeWidth={2}
                  activeDot={{ r: 4, strokeWidth: 0, fill: '#06b6d4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="critical" 
                  stroke="#f0384a" 
                  fill="#f0384a" 
                  fillOpacity={0.05}
                />
                <Area 
                  type="monotone" 
                  dataKey="high" 
                  stroke="#f5942e" 
                  fill="#f5942e" 
                  fillOpacity={0.05}
                />
                <Area 
                  type="monotone" 
                  dataKey="medium" 
                  stroke="#f0c419" 
                  fill="#f0c419" 
                  fillOpacity={0.05}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="border-t border-[var(--border-color)] pt-4 mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#06b6d4]" />
              <span className="text-xs text-[var(--text-secondary)] font-medium">Total</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#f0384a]" />
              <span className="text-xs text-[var(--text-secondary)] font-medium">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#f5942e]" />
              <span className="text-xs text-[var(--text-secondary)] font-medium">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#f0c419]" />
              <span className="text-xs text-[var(--text-secondary)] font-medium">Medium</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
