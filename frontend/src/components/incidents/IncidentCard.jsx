import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import Badge from '../ui/Badge';

const getRiskColor = (score) => {
  if (score >= 80) return '#f0384a';
  if (score >= 60) return '#f5942e';
  if (score >= 40) return '#f0c419';
  return '#2fbf71';
};

const getSeverityDot = (sev) => {
  const colors = { critical: '#f0384a', high: '#f5942e', medium: '#f0c419', low: '#06b6d4' };
  return colors[sev?.toLowerCase()] || '#64748b';
};

export default function IncidentCard({ incident, onClick }) {
  const riskColor = getRiskColor(incident.risk_score);
  const circumference = 2 * Math.PI * 16;
  const strokeDasharray = `${(incident.risk_score / 100) * circumference} ${circumference}`;

  return (
    <div
      onClick={() => onClick(incident)}
      className={`bg-[#13151b] border rounded-2xl p-5 hover:border-[#2a2e38] transition-all cursor-pointer ${
        incident.status === 'active' && incident.severity === 'critical'
          ? 'border-[#f0384a]/30 shadow-[0_0_20px_rgba(240,56,74,0.08)]'
          : 'border-[#1f2229]'
      }`}
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] text-slate-600">{incident.incident_id}</div>
          <div className="text-sm font-semibold text-slate-100 mt-1 line-clamp-2">{incident.title}</div>
        </div>
        {/* Risk gauge */}
        <div className="shrink-0 relative w-11 h-11 flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="w-11 h-11 transform -rotate-90">
            <circle cx="20" cy="20" r="16" fill="none" stroke="#1f2229" strokeWidth="3" />
            <circle cx="20" cy="20" r="16" fill="none" stroke={riskColor} strokeWidth="3"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="absolute text-[10px] font-bold" style={{ color: riskColor }}>{incident.risk_score}</div>
        </div>
      </div>

      {/* Middle tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {incident.attack_pattern && (
          <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-mono px-2 py-0.5 rounded-lg">
            {incident.attack_pattern.replace(/_/g, ' ')}
          </span>
        )}
        {incident.kill_chain_phase && (
          <span className="bg-[#06b6d4]/8 border border-[#06b6d4]/15 text-[#06b6d4] text-[10px] px-2 py-0.5 rounded-lg">
            {incident.kill_chain_phase}
          </span>
        )}
        {incident.alert_count > 0 && (
          <span className="inline-flex items-center gap-1 bg-[#191c24] border border-[#1f2229] rounded-full px-2 py-0.5 text-[10px]">
            <span className="font-semibold text-slate-300">{incident.alert_count}</span>
            <span className="text-slate-600">alerts</span>
          </span>
        )}
      </div>

      {/* Bottom */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {(incident.mitre_tactics || []).slice(0, 3).map((t, i) => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: getSeverityDot(incident.severity) }} />
          ))}
          {(incident.mitre_tactics || []).length > 3 && (
            <span className="text-[10px] text-slate-600 ml-0.5">+{incident.mitre_tactics.length - 3}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600">
            {incident.last_seen ? formatDistanceToNow(new Date(incident.last_seen), { addSuffix: true }) : '—'}
          </span>
          <Badge variant={incident.status === 'resolved' ? 'resolved' : 'open'} size="sm">{incident.status}</Badge>
        </div>
      </div>
    </div>
  );
}
