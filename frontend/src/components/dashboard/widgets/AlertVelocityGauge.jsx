import React, { useMemo } from 'react';
import { useAlertTrend } from '../../../hooks/useAnalytics';
import Card from '../../ui/Card';
import StatPill from '../../ui/StatPill';
import Spinner from '../../ui/Spinner';

export default function AlertVelocityGauge() {
  const { data: trendData, isLoading } = useAlertTrend(7);

  const { todayCount, yesterdayCount, weeklyAvg, percentage, velocityColor, velocityText, isEmpty } = useMemo(() => {
    const trend = trendData?.trend ?? [];
    
    if (trend.length === 0) {
      return { 
        todayCount: 0, 
        yesterdayCount: 0, 
        weeklyAvg: 0, 
        percentage: 0, 
        velocityColor: 'text-slate-600',
        velocityText: 'No activity',
        isEmpty: true
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const todayEntry = trend.find(d => d.date === today);
    const yesterdayEntry = trend.find(d => d.date === yesterday);
    const todayCount = parseInt(todayEntry?.total ?? 0);
    const yesterdayCount = parseInt(yesterdayEntry?.total ?? 0);
    const weeklyTotal = trend.reduce((sum, d) => sum + parseInt(d.total ?? 0), 0);
    const weeklyAvg = trend.length > 0 ? Math.round(weeklyTotal / trend.length) : 0;
    
    const percentage = weeklyAvg === 0 
      ? (todayCount > 0 ? 75 : 0) 
      : Math.min(Math.round((todayCount / (weeklyAvg * 2)) * 100), 100);

    let velocityColor = 'text-slate-500';
    let velocityText = 'Same as yesterday';
    
    if (todayCount === 0 && yesterdayCount === 0) {
      velocityText = 'No activity';
      velocityColor = 'text-slate-600';
    } else if (todayCount > yesterdayCount) {
      velocityText = `+${todayCount - yesterdayCount} vs yesterday`;
      velocityColor = 'text-[#f0384a]';
    } else if (todayCount < yesterdayCount) {
      velocityText = `-${yesterdayCount - todayCount} vs yesterday`;
      velocityColor = 'text-[#2fbf71]';
    }

    return { todayCount, yesterdayCount, weeklyAvg, percentage, velocityColor, velocityText, isEmpty: false };
  }, [trendData]);

  let arcColor = '#2fbf71';
  if (percentage > 75) arcColor = '#f0384a';
  else if (percentage > 50) arcColor = '#f5942e';
  else if (percentage > 25) arcColor = '#4f7fff';

  const CIRCUMFERENCE = Math.PI * 80;

  return (
    <Card title="Alert Velocity" subtitle="Real-time detection rate" className="h-full flex-1 w-full flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] py-4">
        {isLoading ? (
          <Spinner size="md" />
        ) : (
          <div className="w-full max-w-[220px] flex flex-col items-center">
            <div className="relative w-full">
              <svg viewBox="0 0 200 115" className="w-full h-full overflow-visible drop-shadow-sm">
                {/* Background Arc */}
                <path
                  d="M 20,100 A 80,80 0 0,1 180,100"
                  fill="none"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth={10}
                  strokeLinecap="round"
                />
                
                {/* Value Arc */}
                <path
                  d="M 20,100 A 80,80 0 0,1 180,100"
                  fill="none"
                  stroke={arcColor}
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE}
                  className="transition-all duration-1000"
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                <div className="text-4xl font-black text-gray-900 dark:text-slate-100 tabular-nums font-mono text-center leading-none">
                  {todayCount}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-slate-500 text-center mt-1.5 font-medium">
                  alerts today
                </div>
                <div className={`text-[11px] font-bold text-center mt-1 ${velocityColor}`}>
                  {velocityText}
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-5 w-full">
              <StatPill label="7d avg" value={`${weeklyAvg}/day`} color="slate" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
