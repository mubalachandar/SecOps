import React, { useState, useEffect } from 'react';
import { useKEVCatalog } from '../../hooks/useThreatIntel';
import { Loader2, Search, AlertCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

export default function KEVFeed() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isError, error } = useKEVCatalog({
    limit: 50,
    search: debouncedSearch
  });

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      <div className="bg-[#f0384a]/8 border border-[#f0384a]/15 rounded-xl px-4 py-3 flex gap-3 mb-5">
        <AlertOctagon className="w-4 h-4 text-[#f0384a] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#f0384a]/80">These vulnerabilities are actively exploited in the wild. Prioritize patching immediately.</p>
      </div>

      {/* Search row */}
      <div className="flex gap-3 items-center mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Filter by vendor, product, or CVE..."
            className="w-full bg-[#0e1015] border border-[#1f2229] text-slate-100 rounded-xl pl-9 pr-3 py-2.5 text-[11px] focus:outline-none focus:border-[#06b6d4]/50 placeholder-slate-700" />
        </div>
        <div className="bg-[#f0384a]/10 border border-[#f0384a]/20 text-[#f0384a] text-[11px] px-3 py-2 rounded-lg font-medium shrink-0">
          {data?.total || 0} entries
        </div>
      </div>

      {isError && (
        <div className="bg-[#f0384a]/10 border border-[#f0384a]/20 text-[#f0384a] p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-[11px]">{error?.message || 'Failed to fetch KEV catalog'}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-[#06b6d4]/30 border-t-[#06b6d4] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {data?.vulnerabilities?.map(vuln => (
            <div key={vuln.cveID} className="bg-[#0e1015] border border-[#1f2229] rounded-xl p-4 hover:border-[#2a2e38] transition-all">
              <div className="flex items-start justify-between">
                <span className="font-mono text-[11px] text-[#f0384a] font-bold">{vuln.cveID}</span>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-[#191c24] border border-[#2a2e38] text-slate-500 px-2 py-0.5 rounded">{vuln.dateAdded}</span>
                  {vuln.knownRansomwareCampaignUse === 'Known' ? (
                    <span className="text-[10px] bg-[#f0384a]/10 border border-[#f0384a]/20 text-[#f0384a] px-2 py-0.5 rounded">Ransomware</span>
                  ) : (
                    <span className="text-[10px] bg-[#191c24] border border-[#2a2e38] text-slate-600 px-2 py-0.5 rounded">No Ransomware</span>
                  )}
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-200 mt-2">{vuln.product}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{vuln.vendorProject}</div>
              <p className="text-[11px] text-slate-600 line-clamp-2 mt-2">{vuln.shortDescription}</p>
              <div className="mt-3 pt-3 border-t border-[#1f2229] flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#f5942e] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-semibold text-[#f5942e]">Action Required: </span>
                  <span className="text-[11px] text-[#f5942e]/70">{vuln.requiredAction}</span>
                </div>
              </div>
              {vuln.dueDate && (
                <div className="font-mono text-[10px] text-[#f0384a]/70 mt-1">Due: {vuln.dueDate}</div>
              )}
            </div>
          ))}
          {data?.vulnerabilities?.length === 0 && (
            <div className="text-center py-12 text-[11px] text-slate-600">
              No matching vulnerabilities found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
