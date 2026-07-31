import React, { useState } from 'react';
import ThreatIntelStats from '../components/threatintel/ThreatIntelStats';
import CVESearch from '../components/threatintel/CVESearch';
import KEVFeed from '../components/threatintel/KEVFeed';
import { useLatestCVEs } from '../hooks/useThreatIntel';
import CVEDetailCard from '../components/threatintel/CVEDetailCard';
import SectionHeader from '../components/ui/SectionHeader';

function LatestCVEs() {
  const { data, isLoading, isError, error } = useLatestCVEs({ severity: 'HIGH' });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-[#06b6d4]/30 border-t-[#06b6d4] rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-[#f0384a]/10 border border-[#f0384a]/20 text-[#f0384a] p-4 rounded-xl flex items-center gap-3">
        <p className="text-[11px]">{error?.message || 'Failed to fetch latest CVEs'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data?.map(cve => (
        <CVEDetailCard key={cve.cveId} cve={cve} />
      ))}
      {data?.length === 0 && (
        <div className="text-center py-12 bg-[#13151b] rounded-xl border border-[#1f2229]">
          <p className="text-[11px] text-slate-500">No new high/critical CVEs in the last 7 days.</p>
        </div>
      )}
    </div>
  );
}

export default function ThreatIntelPage() {
  const [activeTab, setActiveTab] = useState('search');

  const TABS = [
    { id: 'search', label: 'CVE Search' },
    { id: 'kev', label: 'CISA KEV' },
    { id: 'latest', label: 'Latest CVEs' },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader title="Threat Intelligence" subtitle="CVE database, EPSS exploitation scoring, and CISA KEV catalog" level="page" />

      {/* Data source credits */}
      <div className="flex gap-2 flex-wrap">
        {[{ dot: '#06b6d4', name: 'NVD' }, { dot: 'purple', name: 'FIRST EPSS' }, { dot: '#f0384a', name: 'CISA KEV' }].map(src => (
          <div key={src.name} className="bg-[#13151b] border border-[#1f2229] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: src.dot === 'purple' ? '#a855f7' : src.dot }} />
            <span className="text-[11px] font-medium text-slate-400">{src.name}</span>
          </div>
        ))}
      </div>

      <ThreatIntelStats />

      {/* Underline tabs */}
      <div className="flex gap-1 border-b border-[#1f2229]">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-[11px] font-medium transition-all relative ${
              activeTab === tab.id
                ? 'text-slate-100 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#06b6d4] after:rounded-full'
                : 'text-slate-500 hover:text-slate-300'
            }`}>{tab.label}</button>
        ))}
      </div>

      <div>
        {activeTab === 'search' && <CVESearch />}
        {activeTab === 'kev' && <KEVFeed />}
        {activeTab === 'latest' && <LatestCVEs />}
      </div>
    </div>
  );
}
