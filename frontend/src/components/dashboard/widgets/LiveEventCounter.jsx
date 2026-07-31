import React, { useState, useEffect, useRef } from 'react';
import { useEngineStats } from '../../../hooks/useCloudTrail';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { Loader2, Radio } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function LiveEventCounter() {
  const { data: stats, isLoading } = useEngineStats();
  const { isConnected, lastEvent } = useWebSocket();
  
  const [displayCount, setDisplayCount] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [visibleEvent, setVisibleEvent] = useState(null);
  
  const targetCount = stats?.eventsProcessedToday || stats?.eventsProcessed24h || 0;
  const previousCountRef = useRef(displayCount);

  useEffect(() => {
    if (targetCount === 0 || targetCount === previousCountRef.current) return;

    const startValue = previousCountRef.current;
    const endValue = targetCount;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
      setDisplayCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayCount(endValue);
        previousCountRef.current = endValue;
      }
    };

    requestAnimationFrame(animate);
    
    setIsFlashing(true);
    const flashTimer = setTimeout(() => setIsFlashing(false), 300);
    return () => clearTimeout(flashTimer);
  }, [targetCount]);

  useEffect(() => {
    if (lastEvent?.payload) {
      setVisibleEvent(lastEvent.payload);
      const hideTimer = setTimeout(() => setVisibleEvent(null), 3000);
      return () => clearTimeout(hideTimer);
    }
  }, [lastEvent]);

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl elevation-1 flex items-center justify-center min-h-[300px] h-full">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  const alertsCount = stats?.alertsGeneratedToday || 0;
  const activeRulesCount = stats?.activeRules || 0;
  const lastTime = stats?.lastProcessedAt ? new Date(stats.lastProcessedAt) : new Date();

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl elevation-1 overflow-hidden p-6 flex flex-col h-full flex-1 w-full relative group hover:border-[var(--border-strong)] transition-colors">
      
      {/* Top Row */}
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-slate-400 text-xs uppercase tracking-wider font-bold flex items-center gap-2">
          <Radio className="w-4 h-4 text-accent" />
          Event Counter
        </h3>
        <div className="flex items-center gap-2 bg-[var(--bg-surface-2)] px-3 py-1 rounded-full border border-[var(--border-color)]">
          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${isConnected ? 'bg-[#2fbf71] text-[#2fbf71] animate-pulse' : 'bg-slate-500 text-slate-500'}`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'text-[#2fbf71]' : 'text-slate-500'}`}>
            {isConnected ? 'Live' : 'Polling'}
          </span>
        </div>
      </div>

      {/* Center Counter */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className={`transition-transform duration-300 ${isFlashing ? 'scale-105' : 'scale-100'}`}>
          <div className="text-6xl font-black text-[var(--text-primary)] font-mono tabular-nums tracking-tighter drop-shadow-md">
            {displayCount.toLocaleString()}
          </div>
        </div>
        <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-widest mt-2">events processed today</p>
        
        {/* Live Feed Pill */}
        <div className={`absolute -bottom-8 transition-all duration-500 max-w-[100%] ${visibleEvent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <div className="bg-accent/10 border border-accent/20 text-accent text-[11px] font-mono px-4 py-1.5 rounded-full shadow-lg truncate flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            {visibleEvent?.title || visibleEvent?.type || 'New event received...'}
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-3 gap-4 mt-12 pt-5 border-t border-[var(--border-color)]">
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Alerts</span>
          <span className="text-[var(--text-secondary)] font-mono font-bold text-base">{alertsCount.toLocaleString()}</span>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Active Rules</span>
          <span className="text-[var(--text-secondary)] font-mono font-bold text-base">{activeRulesCount}</span>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Last Event</span>
          <span className="text-[var(--text-secondary)] font-mono font-bold text-base truncate" title={formatDistanceToNow(lastTime, { addSuffix: true })}>
            {formatDistanceToNow(lastTime, { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
