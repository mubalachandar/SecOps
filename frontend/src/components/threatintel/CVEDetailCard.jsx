import React from 'react';
import { format } from 'date-fns';
import { ExternalLink, ShieldAlert, Activity } from 'lucide-react';
import EPSSScoreBar from './EPSSScoreBar';
import clsx from 'clsx';

export default function CVEDetailCard({ cve, compact = false }) {
  if (!cve) return null;

  const cvssColor = cve.cvssScore >= 9 ? '#f0384a' :
                    cve.cvssScore >= 7 ? '#f5942e' :
                    cve.cvssScore >= 4 ? '#f0c419' : '#06b6d4';
  
  const score = cve.cvssScore || cve.cvssV3Score || 0;

  return (
    <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl overflow-hidden shadow-lg mb-4">
      <div className="p-5 border-b border-[#1f2229] flex justify-between items-start flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-mono font-bold text-[#f0384a]">{cve.cveId}</h3>
            {cve.cvssV3Severity && (
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                cve.cvssV3Severity === 'CRITICAL' ? 'bg-[#f0384a]/15 text-[#f0384a]' :
                cve.cvssV3Severity === 'HIGH' ? 'bg-[#f5942e]/15 text-[#f5942e]' :
                cve.cvssV3Severity === 'MEDIUM' ? 'bg-[#f0c419]/15 text-[#f0c419]' :
                'bg-[#06b6d4]/15 text-[#06b6d4]'
              }`}>
                {cve.cvssV3Severity}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-4">
            {cve.publishedDate && <span>Published: {format(new Date(cve.publishedDate), 'MMM dd, yyyy')}</span>}
            {cve.lastModifiedDate && <span>Modified: {format(new Date(cve.lastModifiedDate), 'MMM dd, yyyy')}</span>}
          </div>
        </div>
        
        {score > 0 && (
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 56 56" className="w-14 h-14 transform -rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#1f2229" strokeWidth="4" />
              <circle cx="28" cy="28" r="22" fill="none" stroke={cvssColor} strokeWidth="4"
                strokeDasharray={`${(score / 10) * (2 * Math.PI * 22)} ${2 * Math.PI * 22}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-black" style={{ color: cvssColor }}>{score.toFixed(1)}</span>
              <span className="text-[8px] text-slate-600">CVSS</span>
            </div>
          </div>
        )}
      </div>

      {cve.isInKEV && (
        <div className="mx-5 mt-4 bg-[#f0384a]/10 border border-[#f0384a]/25 rounded-xl p-3.5 flex gap-3">
          <div className="relative mt-0.5 shrink-0">
            <div className="w-2 h-2 rounded-full bg-[#f0384a]" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#f0384a] animate-ping opacity-60" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#f0384a]">ACTIVELY EXPLOITED — Listed in CISA KEV</div>
            {cve.kevData?.dueDate && <div className="text-[11px] text-[#f0384a]/70 mt-1">Required remediation by: {cve.kevData.dueDate}</div>}
          </div>
        </div>
      )}
      
      <div className="p-5 space-y-6">
        <div className="bg-[#0e1015] border border-[#1f2229] p-4 rounded-xl">
          <h4 className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Description</h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {cve.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Metrics & Exploitability</h4>
            
            <EPSSScoreBar epssScore={cve.epssScore} percentile={cve.epssPercentile} />
            
            {cve.cvssV3Vector && (
              <div className="mt-4">
                <span className="text-[10px] text-slate-500 font-mono break-all">{cve.cvssV3Vector}</span>
              </div>
            )}
          </div>
          
          {cve.isInKEV && cve.kevData && (
            <div className="space-y-3 bg-[#191c24] border border-[#2a2e38] p-4 rounded-xl">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-3 h-3" /> KEV Details
              </h4>
              <div className="text-[11px] text-slate-300">
                <p><span className="text-slate-500">Vendor/Project:</span> {cve.kevData.vendorProject}</p>
                <p><span className="text-slate-500">Product:</span> {cve.kevData.product}</p>
                <p><span className="text-slate-500">Date Added:</span> {cve.kevData.dateAdded}</p>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 italic">{cve.kevData.shortDescription}</p>
            </div>
          )}
        </div>

        {cve.references && cve.references.length > 0 && (
          <div className="border-t border-[#1f2229] pt-4">
            <h4 className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-3">References</h4>
            <ul className="space-y-2">
              {cve.references.slice(0, compact ? 3 : 5).map((ref, idx) => (
                <li key={idx}>
                  <a 
                    href={ref.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#06b6d4] hover:text-[#06b6d4]/80 flex items-center gap-2 w-fit"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate max-w-xl block">{ref.url}</span>
                  </a>
                </li>
              ))}
              {cve.references.length > (compact ? 3 : 5) && (
                <li className="text-[10px] text-slate-600 italic">
                  + {cve.references.length - (compact ? 3 : 5)} more references available
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
