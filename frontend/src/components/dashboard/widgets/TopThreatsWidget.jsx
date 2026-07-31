import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { alertsApi } from '../../../services/api';
import Card from '../../ui/Card';
import EmptyState from '../../ui/EmptyState';

export default function TopThreatsWidget() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', 'top-threats'],
    queryFn: () => alertsApi.getAlerts({ severity: ['Critical', 'High'], status: 'open', limit: 5 }),
    select: (data) => data.data || []
  });

  return (
    <Card 
      title="Active Threats" 
      subtitle="Critical open alerts requiring attention" 
      padding="none" 
      className="h-full flex flex-col"
    >
      <div className="flex-1 flex flex-col relative min-h-[200px] overflow-y-auto">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : !alerts || alerts.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <EmptyState icon={CheckCircle} title="No Critical Threats" />
          </div>
        ) : (
          <div className="flex flex-col">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className="flex items-start gap-4 px-5 py-4 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-surface-2)]/50 transition-colors group"
              >
                <div 
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    alert.severity?.toLowerCase() === 'critical' 
                      ? 'bg-[#f0384a]/10' 
                      : 'bg-[#f5942e]/10'
                  }`}
                >
                  <AlertTriangle 
                    className={`w-3.5 h-3.5 ${
                      alert.severity?.toLowerCase() === 'critical' 
                        ? 'text-[#f0384a]' 
                        : 'text-[#f5942e]'
                    }`} 
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-[var(--text-secondary)] text-sm font-medium truncate group-hover:text-accent transition-colors">
                    {alert.title || alert.ruleName}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {alert.mitreTactic && (
                      <div className="text-[var(--text-muted)] text-[10px] font-mono bg-[var(--bg-surface-2)] px-1.5 py-0.5 rounded border border-[var(--border-strong)] uppercase">
                        {alert.mitreTactic}
                      </div>
                    )}
                    {alert.sourceIp && (
                      <div className="text-[var(--text-muted)] font-mono text-[10px]">
                        {alert.sourceIp}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-[var(--text-muted)] text-xs shrink-0 whitespace-nowrap tabular-nums">
                  {alert.timestamp ? formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true }) : 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
