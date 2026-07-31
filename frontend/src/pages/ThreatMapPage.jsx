import React, { useState, useCallback } from 'react';
import { 
  useThreatOrigins, 
  useCountryStats, 
  useLiveThreats, 
  useHeatmapData 
} from '../hooks/useThreatMap';
import WorldMap from '../components/threatmap/WorldMap';
import AttackOriginTable from '../components/threatmap/AttackOriginTable';
import ThreatMapSidebar from '../components/threatmap/ThreatMapSidebar';
import { Globe, Table, Map, AlertTriangle, Activity } from 'lucide-react';
import { format, subDays } from 'date-fns';
import SectionHeader from '../components/ui/SectionHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ThreatMapPage() {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedThreat, setSelectedThreat] = useState(null);
  
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const [appliedRange, setAppliedRange] = useState(dateRange);

  const { data: threatOrigins, isLoading: originsLoading } = useThreatOrigins({
    startDate: appliedRange.start + 'T00:00:00.000Z',
    endDate: appliedRange.end + 'T23:59:59.999Z',
    limit: 100
  });

  const { data: countryStats, isLoading: statsLoading } = useCountryStats({
    startDate: appliedRange.start + 'T00:00:00.000Z',
    endDate: appliedRange.end + 'T23:59:59.999Z'
  });

  const { data: heatmapData, isLoading: heatmapLoading } = useHeatmapData({
    startDate: appliedRange.start + 'T00:00:00.000Z',
    endDate: appliedRange.end + 'T23:59:59.999Z'
  });

  const { data: liveThreats } = useLiveThreats();

  const handleApplyFilters = () => {
    setAppliedRange(dateRange);
    setSelectedThreat(null);
  };

  const handleThreatClick = useCallback((threat) => {
    setSelectedThreat(threat);
  }, []);

  const totalOrigins = threatOrigins?.length || 0;
  const totalCountries = countryStats?.length || 0;
  const flaggedCount = threatOrigins?.filter(t => t.flagged)?.length || 0;
  const liveCount = liveThreats?.length || 0;

  const mapData = heatmapData || [];

  return (
    <div className="space-y-4">
      <SectionHeader title="Global Threat Map" subtitle="Geographic visualization of attack origins and threat intelligence" level="page" />

      {/* View + date controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-[#0e1015] border border-[#1f2229] rounded-lg p-0.5">
          <button onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
              activeTab === 'map' ? 'bg-[#191c24] text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}>
            <Globe className="w-3.5 h-3.5" />World Map
          </button>
          <button onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
              activeTab === 'table' ? 'bg-[#191c24] text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}>
            <Table className="w-3.5 h-3.5" />Attack Table
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600">From</span>
          <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="bg-[#0e1015] border border-[#1f2229] rounded px-2 py-1.5 text-[11px] text-slate-300" />
          <span className="text-[11px] text-slate-600">To</span>
          <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="bg-[#0e1015] border border-[#1f2229] rounded px-2 py-1.5 text-[11px] text-slate-300" />
          <button onClick={handleApplyFilters} className="bg-[#191c24] hover:bg-[#2a2e38] text-slate-300 border border-[#1f2229] px-3 py-1.5 rounded text-[11px] transition-colors">Apply</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[    
          { label: 'Threat Origins', value: totalOrigins, icon: Globe, color: '#06b6d4' },
          { label: 'Countries', value: totalCountries, icon: Map, color: '#a855f7' },
          { label: 'Flagged IPs', value: flaggedCount, icon: AlertTriangle, color: '#f0384a' },
          { label: 'Live Threats', value: liveCount, icon: Activity, color: '#2fbf71', pulse: true },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-[#13151b] border border-[#1f2229] rounded-2xl p-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-500">{stat.label}</div>
                <div className="text-3xl font-bold text-slate-100 mt-1">{stat.value}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#191c24] border border-[#1f2229] flex items-center justify-center">
                <Icon className={`w-5 h-5 ${stat.pulse ? 'animate-pulse' : ''}`} style={{ color: stat.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {activeTab === 'map' ? (
            <WorldMap threats={mapData} isLoading={heatmapLoading} onThreatClick={handleThreatClick} selectedThreat={selectedThreat} />
          ) : (
            <AttackOriginTable threats={threatOrigins} isLoading={originsLoading} onThreatClick={handleThreatClick} selectedThreat={selectedThreat} />
          )}
        </div>
        <div className="lg:col-span-1">
          <ThreatMapSidebar countryStats={countryStats} liveThreats={liveThreats} selectedThreat={selectedThreat} isLoading={statsLoading} />
        </div>
      </div>
    </div>
  );
}
