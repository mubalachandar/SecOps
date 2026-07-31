import React from 'react';
import clsx from 'clsx';
import { Info } from 'lucide-react';

export default function EPSSScoreBar({ epssScore, percentile, className }) {
  if (epssScore === null || epssScore === undefined) {
    return <div className={clsx('text-[11px] text-slate-600', className)}>No EPSS data available</div>;
  }

  const percentage = (epssScore * 100).toFixed(2);
  const percentileFormatted = percentile != null ? (percentile * 100).toFixed(0) : null;

  let color = '#2fbf71'; // green
  let label = 'Very Low Risk';
  if (epssScore > 0.5) { color = '#f0384a'; label = 'Critical Risk'; }
  else if (epssScore > 0.1) { color = '#f5942e'; label = 'High Risk'; }
  else if (epssScore > 0.05) { color = '#f0c419'; label = 'Medium Risk'; }

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-wider text-slate-600">EPSS Score</span>
        <Info className="w-3.5 h-3.5 text-slate-600" title="Exploit Prediction Scoring System" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black" style={{ color }}>{percentage}%</span>
        <span className="text-sm font-medium" style={{ color }}>{label}</span>
      </div>
      <div className="mt-3 w-full bg-[#191c24] rounded-full h-2 overflow-hidden">
        <div
          className="rounded-full h-full transition-all duration-700"
          style={{ width: `${Math.min(Math.max(epssScore * 100, 1), 100)}%`, backgroundColor: color }}
        />
      </div>
      {percentileFormatted != null && (
        <p className="mt-2 text-[10px] text-slate-600">Higher than {percentileFormatted}% of all CVEs</p>
      )}
    </div>
  );
}
