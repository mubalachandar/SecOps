import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { scaleLinear } from 'd3-scale';

const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode === 'XX') return '🌐';
  return String.fromCodePoint(...countryCode.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));
};

export default function ThreatMapSidebar({ countryStats = [], liveThreats = [], selectedThreat, isLoading }) {
  const navigate = useNavigate();

  const totalUniqueIPs = countryStats.reduce((sum, c) => sum + c.uniqueIPs, 0);
  const totalCountries = countryStats.length;
  const totalAlerts = countryStats.reduce((sum, c) => sum + c.totalAlerts, 0);
  const avgAlerts = totalUniqueIPs > 0 ? (totalAlerts / totalUniqueIPs).toFixed(1) : 0;
  
  const flaggedIPs = liveThreats.filter(t => t.severity === 'critical' || t.alertCount >= 3).length || 0;

  const topCountries = countryStats.slice(0, 5);
  const maxAlertCount = topCountries.length > 0 ? topCountries[0].totalAlerts : 1;
  const widthScale = scaleLinear().domain([0, maxAlertCount]).range([0, 100]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {selectedThreat && (
        <div className="bg-[#13151b] border border-[#f0384a]/20 rounded-2xl p-5 shadow-[0_0_30px_rgba(240,56,74,0.08)]">
          <div className="text-center">
            <div className="text-5xl">{getCountryFlag(selectedThreat.geoip?.countryCode || selectedThreat.countryCode)}</div>
            <div className="text-lg font-bold text-slate-100 mt-2">{selectedThreat.geoip?.country || selectedThreat.country}</div>
            <div className="text-sm text-slate-400">{selectedThreat.geoip?.city || selectedThreat.city}, {selectedThreat.geoip?.region || selectedThreat.region}</div>
            <div className="font-mono text-[11px] text-[#06b6d4] bg-[#06b6d4]/8 px-2 py-1 rounded mt-2 inline-block">
              {selectedThreat.source_ip || selectedThreat.ip}
            </div>
            <div className="text-4xl font-black mt-3" style={{ color: '#f0384a' }}>
              {selectedThreat.alert_count || selectedThreat.alertCount || 1}
            </div>
            <p className="text-[10px] text-slate-600">alerts</p>
            <div className="font-mono text-[9px] text-slate-700 mt-1">
              {selectedThreat.geoip?.lat || selectedThreat.lat}, {selectedThreat.geoip?.lon || selectedThreat.lon}
            </div>
            <button
              onClick={() => navigate(`/alerts?source_ip=${selectedThreat.source_ip || selectedThreat.ip}`)}
              className="mt-3 w-full px-3 py-2 bg-[#0e1015] border border-[#1f2229] hover:border-[#2a2e38] text-[11px] text-slate-300 rounded-xl transition-colors"
            >
              View in Alerts →
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-[#1f2229]">
          <h3 className="text-sm font-semibold text-slate-100">Attack Origins</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">By alert count</p>
        </div>
        <div className="p-4 space-y-0">
          {topCountries.map((country, idx) => (
            <div key={country.countryCode || idx} className="flex items-center gap-3 py-2.5 border-b border-[#1f2229] last:border-0">
              <span className="text-lg">{getCountryFlag(country.countryCode)}</span>
              <span className="text-sm text-slate-300 flex-1 truncate">{country.countryCode}</span>
              <div className="w-16 bg-[#191c24] rounded-full h-1 overflow-hidden">
                <div className="bg-[#f0384a]/60 rounded-full h-full" style={{ width: `${widthScale(country.totalAlerts)}%` }} />
              </div>
              <span className="text-[11px] font-semibold text-slate-400 w-8 text-right">{country.totalAlerts}</span>
            </div>
          ))}
          {topCountries.length === 0 && <div className="text-[11px] text-slate-600 py-4 text-center">No data available</div>}
        </div>
      </div>

      <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-[#1f2229] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">Live Feed</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#2fbf71] animate-pulse" />
            <span className="text-[10px] text-[#2fbf71]">Live</span>
          </div>
        </div>
        <div className="p-4 space-y-0">
          {liveThreats.slice(0, 5).map((threat, idx) => {
            const sevColors = { critical: '#f0384a', high: '#f5942e', medium: '#f0c419', low: '#06b6d4' };
            const dotColor = sevColors[threat.severity] || '#64748b';
            return (
              <div key={threat.id || idx} className="flex items-start gap-2.5 py-2.5 border-b border-[#1f2229] last:border-0">
                <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: dotColor }} />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[11px] text-slate-300 truncate">{threat.source_ip}</div>
                  <div className="text-[10px] text-slate-600 truncate">{threat.geoip?.country || 'Unknown'}</div>
                </div>
                <div className="text-[10px] text-slate-700 shrink-0">
                  {threat.created_at ? formatDistanceToNow(new Date(threat.created_at), { addSuffix: false }) : 'now'}
                </div>
              </div>
            );
          })}
          {liveThreats.length === 0 && <div className="text-[11px] text-slate-600 py-4 text-center">No active threats</div>}
        </div>
      </div>
    </div>
  );
}
