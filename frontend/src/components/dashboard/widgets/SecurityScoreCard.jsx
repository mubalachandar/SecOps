import React, { useState, useEffect, useMemo } from 'react';
import { useDashboardStats } from '../../../hooks/useAnalytics';
import { useRuleStats } from '../../../hooks/useRules';
import { useIncidentStats } from '../../../hooks/useIncidents';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import GlowCard from '../../ui/GlowCard';

export default function SecurityScoreCard() {
  const { data: dashData, isLoading: isLoadingDash } = useDashboardStats();
  const { data: ruleData, isLoading: isLoadingRules } = useRuleStats();
  const { data: incData, isLoading: isLoadingInc } = useIncidentStats();
  
  const [animatedScore, setAnimatedScore] = useState(0);

  const isLoading = isLoadingDash || isLoadingRules || isLoadingInc;

  const {
    score,
    grade,
    gradeColor,
    glowColor,
    message,
    criticalAlerts,
    activeIncidents,
    coverageStr,
    isGoodCoverage,
    mttrMinutes,
    trendInfo
  } = useMemo(() => {
    if (!dashData || !ruleData || !incData) {
      return { score: 100, grade: '', gradeColor: '#06b6d4', glowColor: 'accent', message: '', criticalAlerts: 0, activeIncidents: 0, coverageStr: '0%', isGoodCoverage: false, mttrMinutes: 0, trendInfo: null };
    }

    const cAlerts = dashData.overview?.criticalAlerts || 0;
    const resolved = dashData.overview?.resolvedToday || 0;
    const mttr = dashData.overview?.mttrMinutes || 0;
    const tRules = ruleData.total || 0;
    const aRules = ruleData.active || 0;
    const aIncidents = incData.active_incidents || 0;

    let calcScore = 100;
    calcScore -= Math.min(cAlerts * 5, 30);
    calcScore -= Math.min(aIncidents * 10, 30);
    if (tRules > 0) {
      const inactive = tRules - aRules;
      calcScore -= Math.min(inactive * 2, 10);
    }
    if (mttr > 120) calcScore -= 10;
    else if (mttr > 60) calcScore -= 5;
    if (resolved > 0) calcScore += 5;
    const coverage = tRules > 0 ? (aRules / tRules) * 100 : 0;
    if (coverage > 50) calcScore += 5;

    calcScore = Math.max(0, Math.min(100, Math.round(calcScore)));

    let g = '', gc = '', gl = 'accent', msg = '';
    if (calcScore >= 90) { g = 'EXCELLENT'; gc = '#2fbf71'; gl = 'success'; msg = 'Security posture is strong'; }
    else if (calcScore >= 75) { g = 'GOOD'; gc = '#06b6d4'; gl = 'accent'; msg = 'Minor issues require attention'; }
    else if (calcScore >= 60) { g = 'FAIR'; gc = '#f0c419'; gl = 'none'; msg = 'Several threats need investigation'; }
    else if (calcScore >= 40) { g = 'POOR'; gc = '#f5942e'; gl = 'none'; msg = 'Significant security gaps detected'; }
    else { g = 'CRITICAL'; gc = '#f0384a'; gl = 'critical'; msg = 'Immediate action required'; }

    const prevScoreStr = localStorage.getItem('secops_prev_score');
    let tInfo = { dir: 'same', text: 'Stable' };
    if (prevScoreStr) {
      const prevScore = parseInt(prevScoreStr, 10);
      if (calcScore > prevScore) tInfo = { dir: 'up', text: 'Improving' };
      else if (calcScore < prevScore) tInfo = { dir: 'down', text: 'Declining' };
    }
    localStorage.setItem('secops_prev_score', calcScore.toString());

    return {
      score: calcScore,
      grade: g,
      gradeColor: gc,
      glowColor: gl,
      message: msg,
      criticalAlerts: cAlerts,
      activeIncidents: aIncidents,
      coverageStr: `${Math.round(coverage)}%`,
      isGoodCoverage: coverage > 50,
      mttrMinutes: mttr,
      trendInfo: tInfo
    };
  }, [dashData, ruleData, incData]);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setAnimatedScore(score);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, score]);

  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * animatedScore / 100);

  const headerAction = trendInfo && (
    <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-[var(--bg-surface-2)] rounded-full border border-[var(--border-color)]">
      {trendInfo.dir === 'up' && <TrendingUp className="w-3 h-3 text-[#2fbf71]" />}
      {trendInfo.dir === 'down' && <TrendingDown className="w-3 h-3 text-[#f0384a]" />}
      {trendInfo.dir === 'same' && <Minus className="w-3 h-3 text-[var(--text-muted)]" />}
      <span className={trendInfo.dir === 'up' ? 'text-[#2fbf71] font-medium' : trendInfo.dir === 'down' ? 'text-[#f0384a] font-medium' : 'text-[var(--text-muted)] font-medium'}>
        {trendInfo.text}
      </span>
    </div>
  );

  return (
    <GlowCard glow={glowColor} title="Security Posture" subtitle="Overall risk assessment" headerAction={headerAction} className="h-full flex-1 w-full flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center pt-2">
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        ) : (
          <>
            <div className="relative w-48 h-48 mb-6">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                <defs>
                  <filter id="scoreGlow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <circle
                  cx="100" cy="100" r={radius}
                  stroke="#1f2229"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="100" cy="100" r={radius}
                  stroke={gradeColor}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  filter="url(#scoreGlow)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-6xl font-black font-mono tabular-nums tracking-tighter text-[var(--text-primary)] drop-shadow-md">{animatedScore}</span>
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mt-1 font-bold">Score</span>
              </div>
            </div>

            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 border uppercase tracking-wider shadow-sm" 
                    style={{ backgroundColor: `${gradeColor}15`, borderColor: `${gradeColor}30`, color: gradeColor }}>
                {grade}
              </span>
              <p className="text-[var(--text-secondary)] text-sm">{message}</p>
            </div>

            <div className="w-full grid grid-cols-2 gap-3 bg-[var(--bg-surface-2)]/50 rounded-xl p-4 border border-[var(--border-color)]">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)] mb-1">Crit Alerts</span>
                <span className={`text-xl font-bold font-mono tabular-nums ${criticalAlerts > 0 ? 'text-[#f0384a]' : 'text-[var(--text-primary)]'}`}>{criticalAlerts}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)] mb-1">Incidents</span>
                <span className={`text-xl font-bold font-mono tabular-nums ${activeIncidents > 0 ? 'text-[#f0384a]' : 'text-[var(--text-primary)]'}`}>{activeIncidents}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)] mb-1">Coverage</span>
                <span className={`text-xl font-bold font-mono tabular-nums ${isGoodCoverage ? 'text-[#2fbf71]' : 'text-[#f0c419]'}`}>{coverageStr}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)] mb-1">Avg MTTR</span>
                <span className={`text-xl font-bold font-mono tabular-nums ${mttrMinutes > 60 ? 'text-[#f0384a]' : 'text-[var(--text-primary)]'}`}>{mttrMinutes}m</span>
              </div>
            </div>
          </>
        )}
      </div>
    </GlowCard>
  );
}
