import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useRecentAlerts } from '../../hooks/useAnalytics';
import Badge from '../ui/Badge';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Activity } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const severityColors = {
  critical: '#f0384a',
  high: '#f5942e',
  medium: '#f0c419',
  low: '#06b6d4'
};

export default function LiveAlertFeed() {
  const { isConnected, lastEvent } = useWebSocket();
  const { data, isLoading } = useRecentAlerts();
  const navigate = useNavigate();
  
  const [liveAlerts, setLiveAlerts] = useState([]);
  
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'NEW_ALERT') {
      setLiveAlerts(prev => {
        const newAlert = { ...lastEvent.payload.alert, isNewFromWs: true };
        return [newAlert, ...prev].slice(0, 10);
      });
    }
  }, [lastEvent]);

  const combined = [...liveAlerts, ...(data?.alerts || [])];
  const uniqueAlerts = Array.from(new Map(combined.map(a => [a.id, a])).values());
  const sortedAlerts = uniqueAlerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

  return (
    <>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl overflow-hidden flex flex-col h-full elevation-1">
        <div className="px-5 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[#08090c]/50">
          <div>
            <h3 className="text-[var(--text-primary)] font-semibold text-sm">Live Alert Feed</h3>
            <p className="text-[var(--text-muted)] text-xs mt-0.5">Real-time incoming threats</p>
          </div>
          <div className="bg-[var(--bg-surface-2)] border border-[var(--border-strong)] px-2.5 py-1 rounded-full flex items-center gap-2">
            {isConnected ? (
              <>
                <div className="w-2 h-2 rounded-full bg-[#2fbf71] shadow-[0_0_8px_#2fbf71] animate-pulse"></div>
                <span className="text-[#2fbf71] text-[10px] font-bold uppercase">Live</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                <span className="text-slate-400 text-[10px] font-bold uppercase">Connecting...</span>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-96 p-2 space-y-1">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center p-8 gap-3">
              <Activity className="w-6 h-6 text-[var(--text-muted)] animate-pulse" />
              <p className="text-[var(--text-muted)] text-sm">Loading recent alerts...</p>
            </div>
          ) : sortedAlerts.length === 0 ? (
            <div className="h-full flex items-center justify-center p-8">
              <p className="text-[var(--text-muted)] text-sm">Waiting for alerts...</p>
            </div>
          ) : (
            sortedAlerts.map(alert => (
              <div 
                key={alert.id}
                onClick={() => navigate('/alerts')}
                className="group flex items-start gap-4 p-3 rounded-xl hover:bg-[var(--bg-surface-2)]/50 border border-transparent hover:border-[var(--border-strong)] cursor-pointer transition-all"
                style={{ animation: alert.isNewFromWs ? 'fadeIn 0.5s ease-out' : 'none' }}
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_currentColor]"
                  style={{ 
                    backgroundColor: severityColors[alert.severity] || severityColors.low,
                    color: severityColors[alert.severity] || severityColors.low
                  }}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[var(--text-secondary)] text-sm font-medium line-clamp-1 group-hover:text-accent">
                      {alert.title}
                    </h4>
                    {alert.isNewFromWs && (
                      <span className="bg-[var(--bg-surface-2)] text-[var(--text-primary)] text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[var(--border-strong)] whitespace-nowrap">
                        New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant={alert.severity}>{alert.severity}</Badge>
                    <span className="font-mono text-[var(--text-muted)] text-xs">
                      {alert.created_at ? formatDistanceToNow(new Date(alert.created_at), { addSuffix: true }) : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
