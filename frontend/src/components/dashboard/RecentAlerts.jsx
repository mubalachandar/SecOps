import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Shield } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import { useWebSocket } from '../../hooks/useWebSocket';

export default function RecentAlerts({ alerts, isLoading }) {
  const navigate = useNavigate();
  const { lastEvent } = useWebSocket();
  const [liveAlerts, setLiveAlerts] = useState([]);

  useEffect(() => {
    if (lastEvent && lastEvent.type === 'NEW_ALERT') {
      setLiveAlerts(prev => {
        const newAlert = { ...lastEvent.payload.alert, isNewFromWs: true };
        return [newAlert, ...prev];
      });
    }
  }, [lastEvent]);

  const combined = [...liveAlerts, ...(alerts || [])];
  const uniqueAlerts = Array.from(new Map(combined.map(a => [a.id, a])).values());
  const sortedAlerts = uniqueAlerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

  const headerAction = (
    <button
      onClick={() => navigate('/alerts')}
      className="text-accent hover:text-accent/80 text-xs font-semibold uppercase tracking-wider"
    >
      View All →
    </button>
  );

  return (
    <Card 
      title="Recent Alerts" 
      headerAction={headerAction} 
      padding="none" 
      className="h-full"
    >
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-surface-2)]/50">
              <th className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider text-left px-5 py-3">Alert</th>
              <th className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider text-left px-5 py-3">Severity</th>
              <th className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider text-left px-5 py-3">Status</th>
              <th className="hidden lg:table-cell text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider text-left px-5 py-3">Source IP</th>
              <th className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider text-right px-5 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border-color)]">
                  <td className="px-5 py-3.5"><div className="h-4 bg-[var(--bg-surface-2)] rounded animate-pulse w-3/4"></div></td>
                  <td className="px-5 py-3.5"><div className="h-4 bg-[var(--bg-surface-2)] rounded animate-pulse w-1/2"></div></td>
                  <td className="px-5 py-3.5"><div className="h-4 bg-[var(--bg-surface-2)] rounded animate-pulse w-1/2"></div></td>
                  <td className="hidden lg:table-cell px-5 py-3.5"><div className="h-4 bg-[var(--bg-surface-2)] rounded animate-pulse w-2/3"></div></td>
                  <td className="px-5 py-3.5"><div className="h-4 bg-[var(--bg-surface-2)] rounded animate-pulse w-1/2 ml-auto"></div></td>
                </tr>
              ))
            ) : (!sortedAlerts || sortedAlerts.length === 0) ? (
              <tr>
                <td colSpan={5}>
                  <div className="py-12">
                    <EmptyState icon={Shield} title="No alerts" message="All clear." />
                  </div>
                </td>
              </tr>
            ) : (
              sortedAlerts.map((alert) => (
                <tr 
                  key={alert.id}
                  onClick={() => navigate(`/alerts/${alert.id}`)}
                  className={`border-b border-[var(--border-color)] hover:bg-[var(--bg-surface-2)]/50 transition-colors cursor-pointer group ${alert.isNewFromWs ? 'bg-[#2fbf71]/5' : ''}`}
                >
                  <td className="px-5 py-3.5 text-[var(--text-secondary)] text-sm font-medium truncate max-w-[280px] group-hover:text-accent transition-colors">
                    {alert.title}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={alert.severity}>{alert.severity}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={alert.status}>{alert.status}</Badge>
                  </td>
                  <td className="hidden lg:table-cell px-5 py-3.5 text-[var(--text-muted)] text-xs font-mono">
                    {alert.source_ip || 'N/A'}
                  </td>
                  <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs text-right whitespace-nowrap font-mono tabular-nums">
                    {alert.created_at ? formatDistanceToNow(new Date(alert.created_at), { addSuffix: true }) : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
