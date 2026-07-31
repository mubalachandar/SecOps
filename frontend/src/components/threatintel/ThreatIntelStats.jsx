import React from 'react';
import { useCVEStats } from '../../hooks/useThreatIntel';
import { ShieldAlert, TrendingUp, AlertTriangle } from 'lucide-react';

function StatCard({ title, value, icon: Icon, colorClass, subtitle, isLoading }) {
  return (
    <div className={`bg-[#13151b] border ${colorClass} rounded-2xl p-5 transition-all`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-slate-600">{title}</span>
        <div className="w-8 h-8 rounded-xl bg-[#191c24] flex items-center justify-center">
          <Icon className="w-4 h-4 text-slate-500" />
        </div>
      </div>
      <div className="mt-3">
        {isLoading ? (
          <div className="h-8 w-16 bg-[#1f2229] rounded animate-pulse" />
        ) : (
          <span className="text-4xl font-black text-white">{value}</span>
        )}
      </div>
      {subtitle && <p className="text-[11px] text-slate-600 mt-2">{subtitle}</p>}
    </div>
  );
}

export default function ThreatIntelStats() {
  const { data, isLoading } = useCVEStats({ refetchInterval: 3600000 });
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Critical CVEs (7d)" value={data?.criticalLast7Days || 0}
          icon={AlertTriangle} colorClass="border-[#f0384a]/20 hover:border-[#f0384a]/40"
          subtitle="Published in last 7 days" isLoading={isLoading} />
        <StatCard title="High Severity CVEs (7d)" value={data?.highLast7Days || 0}
          icon={TrendingUp} colorClass="border-[#f5942e]/20 hover:border-[#f5942e]/40"
          subtitle="Published in last 7 days" isLoading={isLoading} />
        <StatCard title="CISA KEV Catalog" value={data?.kevTotal?.toLocaleString() || 0}
          icon={ShieldAlert} colorClass="border-purple-500/20 hover:border-purple-500/40"
          subtitle={`Latest: ${data?.kevLatestDate || 'N/A'}`} isLoading={isLoading} />
      </div>
      <p className="text-[10px] text-slate-700 text-right mt-2">
        Data sourced from NVD · FIRST EPSS · CISA KEV — all free public APIs
      </p>
    </div>
  );
}
