import React from 'react';
import { Loader2, Clock } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

export default function MTTRCard({ mttr, isLoading }) {
  if (isLoading) return (
    <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl p-5 flex items-center justify-center h-full min-h-[200px]">
      <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
    </div>
  );

  if (!mttr) return (
    <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl overflow-hidden h-full">
      <div className="px-5 pt-5 pb-3 border-b border-[#1f2229]">
        <h3 className="text-sm font-semibold text-slate-100">Mean Time to Resolve</h3>
      </div>
      <EmptyState icon={Clock} title="No resolved alerts" description="MTTR will appear as alerts are resolved" />
    </div>
  );

  return (
    <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl overflow-hidden h-full">
      <div className="px-5 pt-5 pb-3 border-b border-[#1f2229]">
        <h3 className="text-sm font-semibold text-slate-100">Mean Time to Resolve</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">Resolution performance</p>
      </div>
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-[#06b6d4]">{Math.round(mttr.average)}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-600 mt-1">Avg</div>
          </div>
          <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#2fbf71]">{Math.round(mttr.fastest)}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-600 mt-1">Best</div>
          </div>
          <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#f5942e]">{Math.round(mttr.slowest)}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-600 mt-1">Worst</div>
          </div>
        </div>
        <p className="text-[11px] text-slate-600 text-center">Based on {mttr.sampleSize || 0} resolved alerts over {mttr.periodDays || 30} days · minutes</p>
      </div>
    </div>
  );
}
