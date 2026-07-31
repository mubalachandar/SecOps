import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function StatsCard({ title, value, subtitle, icon, iconBg, iconColor, trend, trendValue, isLoading }) {
  const isDanger = iconColor && (iconColor.includes('red') || iconColor.includes('#f0384a'));
  const dangerStyle = isDanger ? { borderTopColor: 'var(--severity-critical, #f0384a)', borderTopWidth: '2px' } : {};

  if (isLoading) {
    return (
      <div 
        className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl elevation-1 p-5 flex flex-col gap-3 h-full"
        style={dangerStyle}
      >
        <div className="h-3 w-20 bg-[var(--bg-surface-2)] rounded animate-pulse"></div>
        <div className="h-9 w-24 bg-[var(--bg-surface-2)] rounded animate-pulse"></div>
        <div className="flex items-center justify-between mt-auto">
          <div className="h-3 w-16 bg-[var(--bg-surface-2)] rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-[var(--bg-surface-2)] rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div 
      className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl elevation-1 hover:border-[var(--border-strong)] transition-all duration-200 p-5 flex flex-col gap-3 h-full"
      style={dangerStyle}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {title}
      </div>
      <div className="text-4xl font-bold tracking-tight tabular-nums text-[var(--text-primary)] font-mono">
        {displayValue}
      </div>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1">
          {trend === 'up' ? (
            <>
              <TrendingUp className="w-3 h-3 text-[#2fbf71]" />
              <span className="text-xs font-medium text-[#2fbf71]">{trendValue}</span>
            </>
          ) : trend === 'down' ? (
            <>
              <TrendingDown className="w-3 h-3 text-[#f0384a]" />
              <span className="text-xs font-medium text-[#f0384a]">{trendValue}</span>
            </>
          ) : (
            <span className="text-xs text-slate-700">—</span>
          )}
        </div>
        <div 
          className="w-8 h-8 rounded-xl flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
