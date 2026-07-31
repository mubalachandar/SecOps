import React, { useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { useCVESearch, useCVEById, useAWSServiceCVEs } from '../../hooks/useThreatIntel';
import CVEDetailCard from './CVEDetailCard';

const AWS_SERVICES = [
  { id: 's3', label: 'S3' },
  { id: 'iam', label: 'IAM' },
  { id: 'ec2', label: 'EC2' },
  { id: 'lambda', label: 'Lambda' },
  { id: 'cloudtrail', label: 'CloudTrail' },
  { id: 'rds', label: 'RDS' },
];

export default function CVESearch() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('keyword');
  const [activeQuery, setActiveQuery] = useState('');
  const [activeType, setActiveType] = useState('');

  const keywordSearch = useCVESearch({ keyword: activeQuery }, { enabled: activeType === 'keyword' && !!activeQuery });
  const cveSearch = useCVEById(activeType === 'cve' ? activeQuery : null);
  const awsSearch = useAWSServiceCVEs(activeType === 'aws' ? activeQuery : null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query || query.length < 3) return;
    setActiveQuery(query);
    setActiveType(searchType);
  };

  const handleAWSClick = (service) => {
    setActiveQuery(service);
    setActiveType('aws');
  };

  const isLoading = keywordSearch.isLoading || cveSearch.isLoading || awsSearch.isLoading;
  const isError = keywordSearch.isError || cveSearch.isError || awsSearch.isError;
  const error = keywordSearch.error || cveSearch.error || awsSearch.error;

  const SEARCH_TYPES = [{ id: 'keyword', label: 'Keyword' }, { id: 'cve', label: 'CVE ID' }, { id: 'aws', label: 'AWS Service' }];

  const results = activeType === 'keyword' ? keywordSearch.data?.results
    : activeType === 'aws' ? awsSearch.data?.results
    : null;

  return (
    <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-slate-100 mb-4">CVE Search</h3>
      {/* Search type tabs */}
      <div className="flex bg-[#0e1015] border border-[#1f2229] rounded-lg p-0.5 mb-4">
        {SEARCH_TYPES.map(t => (
          <button key={t.id} onClick={() => setSearchType(t.id)}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
              searchType === t.id ? 'bg-[#191c24] text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}>{t.label}</button>
        ))}
      </div>

      {searchType === 'aws' ? (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {AWS_SERVICES.map(svc => (
            <button key={svc.id} onClick={() => handleAWSClick(svc.id)}
              className="bg-[#0e1015] border border-[#1f2229] hover:border-[#06b6d4]/30 hover:bg-[#06b6d4]/5 rounded-xl p-3 text-center cursor-pointer transition-all">
              <div className="w-8 h-8 rounded-lg bg-[#191c24] flex items-center justify-center mx-auto text-sm font-bold text-[#06b6d4]">
                {svc.label[0]}
              </div>
              <div className="text-[11px] text-slate-400 mt-2">{svc.label}</div>
            </button>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchType === 'cve' ? 'CVE-2021-44228' : 'e.g. log4j, apache'}
              className="w-full bg-[#0e1015] border border-[#1f2229] text-slate-100 rounded-xl pl-9 pr-3 py-2.5 text-[11px] focus:outline-none focus:border-[#06b6d4]/50 placeholder-slate-700"
            />
          </div>
          <button type="submit" disabled={isLoading || query.length < 3}
            className="px-4 py-2.5 bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white rounded-xl text-[11px] font-medium transition-colors disabled:opacity-50">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Search'}
          </button>
        </form>
      )}

      {isError && (
        <div className="bg-[#f0384a]/8 border border-[#f0384a]/20 rounded-xl px-4 py-3 flex items-start gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-[#f0384a] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#f0384a]">{error?.message || 'Search failed'}</p>
        </div>
      )}

      {/* Results */}
      {activeType === 'cve' && cveSearch.data && (
        <div className="mt-2"><CVEDetailCard cve={cveSearch.data} compact /></div>
      )}

      {results && (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {results.length === 0 ? (
            <div className="text-center py-8 text-[11px] text-slate-600">No results for "{activeQuery}"</div>
          ) : results.map((cve, idx) => (
            <div key={cve.cveId || idx}
              className="bg-[#0e1015] hover:bg-[#191c24] border border-[#1f2229] hover:border-[#2a2e38] rounded-xl p-3.5 cursor-pointer transition-all">
              <div className="flex items-start justify-between">
                <span className="font-mono text-[11px] text-[#f0384a] font-bold">{cve.cveId}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  cve.cvssScore >= 9 ? 'bg-[#f0384a]/15 text-[#f0384a]' :
                  cve.cvssScore >= 7 ? 'bg-[#f5942e]/15 text-[#f5942e]' :
                  'bg-[#f0c419]/15 text-[#f0c419]'
                }`}>{cve.cvssScore?.toFixed(1)}</span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5">{cve.description}</p>
              <p className="text-[10px] text-slate-700 mt-1.5">{cve.publishedDate}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
