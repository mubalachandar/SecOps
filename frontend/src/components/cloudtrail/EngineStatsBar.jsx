import React from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import StatPill from '../ui/StatPill'

export default function EngineStatsBar({ stats, isLoading }) {
  let formattedTime = 'Never';
  try {
    if (stats?.lastProcessedAt) {
      formattedTime = formatDistanceToNow(parseISO(stats.lastProcessedAt), { addSuffix: true });
    }
  } catch (e) {
    console.error('EngineStatsBar date error:', e, stats?.lastProcessedAt);
    formattedTime = 'Invalid Date';
  }

  return (
    <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl px-5 py-3 flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-[#2fbf71]" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#2fbf71] animate-ping opacity-60" />
        </div>
        <span className="text-sm font-semibold text-slate-200">Detection Engine</span>
        <span className="text-[11px] text-[#2fbf71]">Operational</span>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <StatPill label="Active Rules" value={isLoading ? '…' : (stats?.activeRules ?? '—')} color="accent" />
        <StatPill label="Events Today" value={isLoading ? '…' : (stats?.eventsProcessedToday ?? '—')} color="slate" />
        <StatPill label="Alerts Generated" value={isLoading ? '…' : (stats?.alertsGeneratedToday ?? '—')} color="high" />
        <StatPill label="Last Processed" value={isLoading ? '…' : formattedTime} color="slate" />
      </div>
    </div>
  )
}
