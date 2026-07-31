import React from 'react';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const serviceNames = {
  database: 'PostgreSQL Database',
  detectionEngine: 'Detection Engine',
  aiAnalysis: 'Gemini AI Analysis',
  logIngestion: 'CloudTrail Ingestion'
};

const statusConfig = {
  operational: {
    color: '#2fbf71',
    text: 'Operational'
  },
  degraded: {
    color: '#f5942e',
    text: 'Degraded'
  },
  down: {
    color: '#f0384a',
    text: 'Down'
  }
};

export default function SystemHealth({ health = [], isLoading, checkedAt }) {
  return (
    <Card title="System Health" padding="md" className="h-full flex flex-col">
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--bg-surface-2)]"></div>
                <div className="h-4 w-32 bg-[var(--bg-surface-2)] rounded"></div>
              </div>
              <div className="h-4 w-16 bg-[var(--bg-surface-2)] rounded"></div>
            </div>
          ))}
        </div>
      ) : health.length === 0 ? (
        <div className="p-4 bg-[var(--bg-surface-2)]/30 rounded border border-[var(--border-color)]">
          <p className="text-[var(--text-muted)] text-sm text-center">No health data available.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {health.map((item) => {
            const config = statusConfig[item.status] || statusConfig.down;
            return (
              <div key={item.service} className="flex items-center justify-between py-3 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-surface-2)]/30 px-2 -mx-2 rounded transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                    style={{ backgroundColor: config.color, color: config.color }}
                  ></div>
                  <span className="text-[var(--text-secondary)] text-sm font-medium">
                    {serviceNames[item.service] || item.service}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {item.activeRules !== undefined && (
                    <span className="text-[var(--text-muted)] text-xs font-mono tabular-nums bg-[var(--bg-surface-2)] px-2 py-0.5 rounded-full border border-[var(--border-strong)]">
                      {item.activeRules} rules
                    </span>
                  )}
                  <span 
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: config.color }}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {!isLoading && checkedAt && (
        <div className="border-t border-[var(--border-color)] mt-auto pt-3 flex items-center justify-between text-[var(--text-muted)] text-[11px]">
          <span>Checked {formatDistanceToNow(new Date(checkedAt))} ago</span>
          <span>Status monitoring active</span>
        </div>
      )}
    </Card>
  );
}
