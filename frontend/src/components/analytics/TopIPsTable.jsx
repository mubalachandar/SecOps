import React from 'react';
import { Globe, Loader2 } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function TopIPsTable({ ips, isLoading }) {
  const getCountryFlag = (country) => {
    const cc = { 'United States': '🇺🇸', 'China': '🇨🇳', 'Russia': '🇷🇺', 'Germany': '🇩🇪', 'United Kingdom': '🇬🇧', 'France': '🇫🇷', 'India': '🇮🇳', 'Brazil': '🇧🇷', 'Canada': '🇨🇦', 'Australia': '🇦🇺' };
    return cc[country] || '🌐';
  };

  return (
    <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-[#1f2229]">
        <h3 className="text-sm font-semibold text-slate-100">Top Source IPs</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">Highest alert-generating source addresses</p>
      </div>
      {isLoading ? (
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
        </div>
      ) : ips.length === 0 ? (
        <EmptyState icon={Globe} title="No IP data" description="IP data will appear as events are processed" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0e1015] border-b border-[#1f2229]">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left w-44">Country</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left">IP Address</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-center w-20">Alerts</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left w-32">Last Seen</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left w-36 hidden lg:table-cell">Severities</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-center w-16">Risk</th>
              </tr>
            </thead>
            <tbody>
              {ips.map((ip, i) => {
                const flagged = ip.alertCount >= 3;
                return (
                  <tr key={i} className={`border-b border-[#1f2229] hover:bg-[#191c24] transition-colors ${flagged ? 'border-l-2 border-l-[#f0384a] bg-[#f0384a]/[0.02]' : ''}`}>
                    <td className="px-5 py-3.5 w-44">
                      <span className="text-[11px] text-slate-400">{getCountryFlag(ip.country)} {ip.country || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-300">{ip.sourceIp || ip.source_ip}</td>
                    <td className="px-5 py-3.5 text-center w-20">
                      <span className={`text-[11px] font-semibold ${flagged ? 'text-[#f0384a]' : 'text-slate-300'}`}>{ip.alertCount}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[11px] text-slate-500 w-32">
                      {ip.lastSeen ? formatDistanceToNow(new Date(ip.lastSeen), { addSuffix: true }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell w-36">
                      <div className="flex items-center gap-1">
                        {ip.criticalCount > 0 && <span className="w-2 h-2 rounded-full bg-[#f0384a] shrink-0" title={`${ip.criticalCount} critical`} />}
                        {ip.highCount > 0 && <span className="w-2 h-2 rounded-full bg-[#f5942e] shrink-0" title={`${ip.highCount} high`} />}
                        {ip.mediumCount > 0 && <span className="w-2 h-2 rounded-full bg-[#f0c419] shrink-0" title={`${ip.mediumCount} medium`} />}
                        {!ip.criticalCount && !ip.highCount && !ip.mediumCount && <span className="text-[11px] text-slate-700">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center w-16">
                      <div className={`w-3 h-3 rounded-full mx-auto ${flagged ? 'bg-[#f0384a]' : 'bg-[#2fbf71]'}`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
