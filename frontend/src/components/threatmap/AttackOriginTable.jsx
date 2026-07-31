import React from 'react';
import { Eye, Globe, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode === 'XX') return '🌐';
  return String.fromCodePoint(...countryCode.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));
};

export default function AttackOriginTable({ threats = [], isLoading, onThreatClick, selectedThreat }) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="bg-[#0e1015] px-5 py-3 border-b border-[#1f2229] text-[10px] font-semibold uppercase tracking-wider text-slate-600 w-44">Country</th>
              <th className="bg-[#0e1015] px-5 py-3 border-b border-[#1f2229] text-[10px] font-semibold uppercase tracking-wider text-slate-600 w-32 hidden md:table-cell">City</th>
              <th className="bg-[#0e1015] px-5 py-3 border-b border-[#1f2229] text-[10px] font-semibold uppercase tracking-wider text-slate-600 flex-1">IP Address</th>
              <th className="bg-[#0e1015] px-5 py-3 border-b border-[#1f2229] text-[10px] font-semibold uppercase tracking-wider text-slate-600 w-16 text-center">Alerts</th>
              <th className="bg-[#0e1015] px-5 py-3 border-b border-[#1f2229] text-[10px] font-semibold uppercase tracking-wider text-slate-600 w-24">Severity</th>
              <th className="bg-[#0e1015] px-5 py-3 border-b border-[#1f2229] text-[10px] font-semibold uppercase tracking-wider text-slate-600 w-16 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2229]">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-5 py-3.5"><div className="h-4 bg-[#1f2229] rounded w-24"></div></td>
                  <td className="px-5 py-3.5 hidden md:table-cell"><div className="h-4 bg-[#1f2229] rounded w-16"></div></td>
                  <td className="px-5 py-3.5"><div className="h-4 bg-[#1f2229] rounded w-24"></div></td>
                  <td className="px-5 py-3.5"><div className="h-4 bg-[#1f2229] rounded w-8 mx-auto"></div></td>
                  <td className="px-5 py-3.5"><div className="h-4 bg-[#1f2229] rounded w-16"></div></td>
                  <td className="px-5 py-3.5"><div className="h-4 bg-[#1f2229] rounded w-6 ml-auto"></div></td>
                </tr>
              ))
            ) : threats.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-12 text-center">
                  <Globe className="w-8 h-8 text-slate-700 mx-auto mb-3 opacity-50" />
                  <div className="text-[11px] text-slate-600">No threat data available</div>
                </td>
              </tr>
            ) : (
              threats.map((threat) => {
                const isSelected = selectedThreat?.source_ip === threat.source_ip;
                const flagged = threat.alert_count >= 3 || threat.flagged;
                const { geoip, source_ip, alert_count, max_severity } = threat;
                
                return (
                  <tr 
                    key={source_ip} 
                    onClick={() => onThreatClick(threat)}
                    className={`cursor-pointer transition-colors px-5 py-3.5 border-b border-[#1f2229] hover:bg-[#191c24] ${
                      isSelected 
                        ? 'bg-[#06b6d4]/8 border-l-2 border-l-[#06b6d4]' 
                        : flagged 
                          ? 'bg-[#f0384a]/[0.03] border-l-2 border-l-[#f0384a]'
                          : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium flex items-center gap-2 text-slate-300">
                        <span className="text-lg">{getCountryFlag(geoip.countryCode)}</span>
                        {geoip.country}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[11px] text-slate-500 hidden md:table-cell">
                      {geoip.city || 'Unknown'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] text-slate-300">{source_ip}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[11px] font-bold ${
                        alert_count >= 10 ? 'text-[#f0384a]' : alert_count >= 5 ? 'text-[#f5942e]' : 'text-slate-300'
                      }`}>{alert_count}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize ${
                        max_severity === 'critical' ? 'bg-[#f0384a]/15 text-[#f0384a]' :
                        max_severity === 'high' ? 'bg-[#f5942e]/15 text-[#f5942e]' :
                        max_severity === 'medium' ? 'bg-[#f0c419]/15 text-[#f0c419]' :
                        'bg-[#06b6d4]/15 text-[#06b6d4]'
                      }`}>
                        {max_severity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button 
                        className={`p-1.5 rounded transition-colors ${isSelected ? 'text-[#06b6d4] bg-[#06b6d4]/20' : 'text-slate-500 hover:text-slate-300 hover:bg-[#191c24]'}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
