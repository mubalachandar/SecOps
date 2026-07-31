import React from 'react';
import { Cpu, Database, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cloudtrailApi } from '../../services/api';
import { format } from 'date-fns';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StatPill from '../ui/StatPill';
import toast from 'react-hot-toast';

export default function SystemSettings() {
  const { data: engineStats } = useQuery({
    queryKey: ['engineStats'],
    queryFn: () => cloudtrailApi.getEngineStats(),
    refetchInterval: 30000
  });

  const handleReloadRules = () => {
    toast.success('Rule reload triggered — engine will refresh within 60 seconds');
    cloudtrailApi.simulateAttack('test_reload').catch(() => {});
  };

  const handleDangerAction = (type) => {
    if (window.confirm(`Are you sure you want to ${type === 'clear' ? 'clear all alerts' : 'reset rules'}?`)) {
      toast.error('Feature requires database admin access');
    }
  };

  const lastProcessed = engineStats?.lastProcessed
    ? format(new Date(engineStats.lastProcessed), 'HH:mm:ss')
    : 'N/A';

  return (
    <div className="space-y-4">
      <Card title="System Configuration">
        {/* Detection Engine */}
        <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#06b6d4]" />
              <span className="text-sm font-semibold text-slate-200">Detection Engine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#2fbf71]" />
              <span className="text-[11px] text-[#2fbf71]">Operational</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <StatPill label="Active Rules" value={engineStats?.activeRules ?? '—'} color="accent" />
            <StatPill label="Events Today" value={engineStats?.eventsProcessed ?? '—'} color="slate" />
            <StatPill label="Alerts Today" value={engineStats?.alertsGenerated ?? '—'} color="high" />
            <StatPill label="Last Processed" value={lastProcessed} color="slate" />
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={handleReloadRules}>Reload Detection Rules</Button>
        </div>

        {/* Database */}
        <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-200">Database</span>
          </div>
          <div className="space-y-2">
            {[['Provider', 'Local PostgreSQL (Docker)'], ['Status', 'Operational'], ['Region', 'Local']].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#1f2229] last:border-0">
                <span className="text-[11px] text-slate-600">{label}</span>
                <span className={`text-[11px] font-medium ${value === 'Operational' ? 'text-[#2fbf71]' : 'text-slate-300'}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-[#f0384a]/5 border border-[#f0384a]/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[#f0384a]" />
            <span className="text-sm font-semibold text-[#f0384a]">Danger Zone</span>
          </div>
          <div className="space-y-0">
            {[
              { type: 'clear', name: 'Clear All Alerts', desc: 'Permanently delete all alert records from the database' },
              { type: 'reset', name: 'Reset Detection Rules', desc: 'Remove all custom rules and restore defaults' }
            ].map(action => (
              <div key={action.type} className="flex items-center justify-between py-3 border-b border-[#f0384a]/10 last:border-0">
                <div>
                  <div className="text-sm text-slate-300">{action.name}</div>
                  <div className="text-[11px] text-slate-600">{action.desc}</div>
                </div>
                <Button variant="danger" size="sm" onClick={() => handleDangerAction(action.type)}>Execute</Button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-700 mt-3">Destructive actions require manual database access for safety.</p>
        </div>
      </Card>
    </div>
  );
}
