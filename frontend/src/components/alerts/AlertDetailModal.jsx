import React, { useState } from 'react';
import { X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useUpdateAlertStatus } from '../../hooks/useAlerts';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Button from '../ui/Button';
import AIAnalysisPanel from './AIAnalysisPanel';

export default function AlertDetailModal({ alert, isOpen, onClose }) {
  const [showRawEvent, setShowRawEvent] = useState(false);
  const updateStatus = useUpdateAlertStatus();

  if (!alert) return null;

  const handleStatusChange = (e) => {
    updateStatus.mutate({ id: alert.id, status: e.target.value });
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div 
        className={`fixed z-50 overflow-y-auto bg-white dark:bg-slate-900 transition-transform duration-300 ease-in-out
          bottom-0 left-0 right-0 h-[90vh] w-full rounded-t-2xl border-t border-gray-200 dark:border-slate-800 
          md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:max-w-2xl md:rounded-none md:border-t-0 md:border-l 
          ${isOpen ? 'translate-y-0 md:translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}`}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 z-10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-gray-900 dark:text-slate-100 font-semibold text-lg truncate pr-4">{alert.title}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* SECTION 1 — Alert Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
            <div>
              <div className="text-gray-500 dark:text-slate-500 text-xs mb-1">Severity</div>
              <Badge variant={alert.severity} className="capitalize">{alert.severity}</Badge>
            </div>
            <div>
              <div className="text-gray-500 dark:text-slate-500 text-xs mb-1">Status</div>
              <div className="flex items-center gap-2">
                <Badge variant={alert.status} className="capitalize">{alert.status}</Badge>
                <select 
                  value={alert.status}
                  onChange={handleStatusChange}
                  className="bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs border border-gray-300 dark:border-slate-700 rounded-md px-2 py-1 outline-none"
                >
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="false_positive">False Positive</option>
                </select>
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-xs mb-1">Alert ID</div>
              <div className="font-mono text-xs text-slate-400">{alert.alert_id}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs mb-1">Created At</div>
              <div className="text-sm text-slate-300">{alert.created_at ? format(parseISO(alert.created_at), 'PPpp') : '—'}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs mb-1">Event Type</div>
              <div className="text-sm text-slate-300">{alert.event_type || '—'}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs mb-1">Source</div>
              <div className="text-sm text-slate-300">{alert.source || '—'}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs mb-1">Region</div>
              <div className="text-sm text-slate-300">{alert.region || '—'}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs mb-1">Source IP</div>
              <div className="font-mono text-sm text-slate-300">{alert.source_ip || '—'}</div>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <div className="text-slate-500 text-xs mb-1">Affected Resource</div>
              <div className="font-mono text-xs text-slate-300 truncate">{alert.affected_resource || '—'}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs mb-1">MITRE Tactic</div>
              <div className="text-sm text-blue-400">{alert.mitre_tactic || '—'}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs mb-1">MITRE Technique</div>
              <div className="text-sm text-blue-400">{alert.mitre_technique || '—'}</div>
            </div>
          </div>

          {/* SECTION 2 — Description */}
          <Card title="Description" padding="md">
            <p className="text-slate-300 text-sm leading-relaxed">{alert.description || 'No description available.'}</p>
          </Card>

          {/* SECTION 3 — Raw Event */}
          <Card title="Raw CloudTrail Event" padding="md">
            <Button variant="ghost" size="sm" onClick={() => setShowRawEvent(!showRawEvent)} className="mb-2">
              {showRawEvent ? 'Hide Raw Event' : 'Show Raw Event'}
            </Button>
            {showRawEvent && (
              <pre className="text-xs text-slate-300 overflow-x-auto bg-slate-950 p-4 rounded-lg font-mono max-h-64 overflow-y-auto">
                {JSON.stringify(alert.raw_event, null, 2)}
              </pre>
            )}
          </Card>

          {/* SECTION 4 — AI Analysis */}
          <AIAnalysisPanel alertId={alert.id} />
        </div>
      </div>
    </>
  );
}
