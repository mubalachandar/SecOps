import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldAlert, ArrowRight } from 'lucide-react';
import { useCVEStats } from '../../hooks/useThreatIntel';

export default function ThreatIntelWidget() {
  const { data, isLoading } = useCVEStats();

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
      <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/30">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-purple-400" />
          Threat Intel
        </h3>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/30 flex items-center justify-between">
            <span className="text-sm text-slate-400">Critical (7d)</span>
            <span className="text-lg font-bold text-red-400">
              {isLoading ? '...' : (data?.criticalLast7Days || 0)}
            </span>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/30 flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-red-500" /> KEV Total
            </span>
            <span className="text-lg font-bold text-slate-200">
              {isLoading ? '...' : (data?.kevTotal?.toLocaleString() || 0)}
            </span>
          </div>
        </div>
        <Link 
          to="/threat-intel" 
          className="mt-4 w-full py-2 bg-slate-700/50 hover:bg-slate-700 text-sm font-medium text-slate-200 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-600/50"
        >
          Open Database <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
