import React, { useState, useCallback } from 'react';
import { RefreshCw, Layers } from 'lucide-react';
import { useIncidents, useIncidentStats, useTriggerCorrelation } from '../hooks/useIncidents';
import IncidentCard from '../components/incidents/IncidentCard';
import IncidentDetailModal from '../components/incidents/IncidentDetailModal';
import SectionHeader from '../components/ui/SectionHeader';
import StatPill from '../components/ui/StatPill';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

export default function IncidentsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filters = {};
  if (statusFilter !== 'all') filters.status = statusFilter;
  if (severityFilter !== 'all') filters.severity = severityFilter;

  const { data, isLoading } = useIncidents(filters);
  const { data: stats } = useIncidentStats();
  const triggerCorrelation = useTriggerCorrelation();

  const incidents = data?.data || (Array.isArray(data) ? data : [])
  const avgRisk = stats?.avgRiskScore ? Math.round(stats.avgRiskScore) : '—';

  const handleIncidentClick = useCallback((incident) => {
    setSelectedIncident(incident);
    setIsDetailOpen(true);
  }, []);

  const STATUS_TABS = [{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'resolved', label: 'Resolved' }];
  const SEV_TABS = [{ value: 'all', label: 'All' }, { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }];

  return (
    <div className="space-y-4">
      <SectionHeader title="Security Incidents" subtitle="Correlated attack campaigns requiring investigation" level="page" />

      {/* Status bar */}
      <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl px-5 py-3 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <StatPill label="Total" value={stats?.total ?? '—'} color="slate" />
          <StatPill label="Active" value={stats?.active ?? '—'} color="critical" />
          <StatPill label="Resolved" value={stats?.resolved ?? '—'} color="success" />
          <StatPill label="Avg Risk" value={avgRisk} color="high" />
        </div>
        <Button variant="outline" size="sm" onClick={() => triggerCorrelation.mutate()} isLoading={triggerCorrelation.isPending}>
          <RefreshCw className="w-3.5 h-3.5" />
          Run Correlation
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-[#0e1015] border border-[#1f2229] rounded-lg p-0.5">
          {STATUS_TABS.map(tab => (
            <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                statusFilter === tab.value ? 'bg-[#191c24] text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}>{tab.label}</button>
          ))}
        </div>
        <div className="flex bg-[#0e1015] border border-[#1f2229] rounded-lg p-0.5">
          {SEV_TABS.map(tab => (
            <button key={tab.value} onClick={() => setSeverityFilter(tab.value)}
              className={`px-4 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                severityFilter === tab.value ? 'bg-[#191c24] text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* Grid or empty */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#13151b] border border-[#1f2229] rounded-2xl p-5 h-48 animate-pulse" />
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <EmptyState icon={Layers} title="No incidents found" description="Correlated incidents will appear here as alerts are detected" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {incidents.map(incident => (
            <IncidentCard key={incident.id || incident.incident_id} incident={incident} onClick={handleIncidentClick} />
          ))}
        </div>
      )}

      <IncidentDetailModal
        incident={selectedIncident}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedIncident(null); }}
      />
    </div>
  );
}
