import React from 'react';
import { Shield } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

export default function AlertsTable({
  alerts,
  isLoading,
  onAlertClick,
  onStatusChange,
  onBulkStatusChange,
  pagination,
  onPageChange,
  selectedIds,
  onSelectAlert,
  onSelectAll
}) {
  const { page, limit, total, totalPages } = pagination;
  const isAllSelected = alerts.length > 0 && selectedIds.length === alerts.length;

  return (
    <Card padding="none">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-4 min-h-[64px]">
        <input 
          type="checkbox" 
          className="accent-blue-500 w-4 h-4 cursor-pointer"
          checked={isAllSelected}
          onChange={onSelectAll}
        />
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-400">{selectedIds.length} selected</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onBulkStatusChange('investigating')}>Mark Investigating</Button>
              <Button variant="ghost" size="sm" onClick={() => onBulkStatusChange('resolved')}>Mark Resolved</Button>
              <Button variant="ghost" size="sm" onClick={() => onBulkStatusChange('false_positive')}>Mark False Positive</Button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-500 text-xs font-medium uppercase tracking-wider text-left border-b border-gray-200 dark:border-slate-800">
              <th className="px-4 py-3 w-12"></th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 hidden md:table-cell">MITRE</th>
              <th className="px-4 py-3 hidden md:table-cell">Source IP</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  <td className="px-4 py-4"><div className="h-4 w-4 bg-slate-800 rounded animate-pulse"></div></td>
                  <td className="px-4 py-4"><div className="h-5 bg-slate-800 rounded w-16 animate-pulse"></div></td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-slate-800 rounded w-3/4 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-slate-800 rounded w-1/2 animate-pulse"></div>
                  </td>
                  <td className="px-4 py-4"><div className="h-5 bg-slate-800 rounded w-16 animate-pulse"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-800 rounded w-24 animate-pulse"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-800 rounded w-20 animate-pulse"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-800 rounded w-16 animate-pulse"></div></td>
                  <td className="px-4 py-4"><div className="h-6 bg-slate-800 rounded w-12 animate-pulse"></div></td>
                </tr>
              ))
            ) : alerts && alerts.length > 0 ? (
              alerts.map(alert => (
                <tr 
                  key={alert.id}
                  onClick={() => onAlertClick(alert)}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox"
                      className="accent-blue-500 w-4 h-4 cursor-pointer"
                      checked={selectedIds.includes(alert.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectAlert(alert.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-3 capitalize">
                    <div className="flex items-center gap-2">
                      {(alert.severity === 'critical' || alert.severity === 'high') && (
                        <div className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                      )}
                      <Badge variant={alert.severity}>{alert.severity}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-100 text-sm font-medium truncate max-w-xs">{alert.title}</div>
                    <div className="text-slate-500 text-xs truncate max-w-xs">{alert.event_type}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">
                    <Badge variant={alert.status}>{alert.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs font-mono hidden md:table-cell">{alert.mitre_tactic || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs font-mono hidden md:table-cell">{alert.source_ip || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {alert.created_at ? `${formatDistanceToNow(parseISO(alert.created_at))} ago` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onAlertClick(alert);
                        }}
                      >
                        View
                      </Button>
                      <select 
                        value={alert.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          onStatusChange(alert.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-800 text-slate-300 text-xs border border-slate-700 rounded-md px-2 py-1 outline-none"
                      >
                        <option value="open">Open</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                        <option value="false_positive">False Positive</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-0">
                  <EmptyState 
                    icon={Shield} 
                    title="No alerts match your filters" 
                    description="Try adjusting the severity or status filters" 
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-between">
        <div className="text-slate-500 text-sm">
          Page {page} of {totalPages} — {total} total alerts
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
