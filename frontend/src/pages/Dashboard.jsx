import React, { useState, useEffect, useMemo } from 'react';
import {
  useDashboardStats, useAlertTrend,
  useSeverityDistribution, useRecentAlerts
} from '../hooks/useAnalytics';
import { useIncidentStats } from '../hooks/useIncidents';
import { useAuthStore } from '../store/authStore';
import StatsCard from '../components/dashboard/StatsCard';
import AlertTrendChart from '../components/dashboard/AlertTrendChart';
import RecentAlerts from '../components/dashboard/RecentAlerts';
import SeverityChart from '../components/dashboard/SeverityChart';
import SystemHealth from '../components/dashboard/SystemHealth';
import LiveAlertFeed from '../components/dashboard/LiveAlertFeed';

import SecurityScoreCard from '../components/dashboard/widgets/SecurityScoreCard';
import LiveEventCounter from '../components/dashboard/widgets/LiveEventCounter';
import AlertVelocityGauge from '../components/dashboard/widgets/AlertVelocityGauge';
import MitreHeatmapWidget from '../components/dashboard/widgets/MitreHeatmapWidget';
import ThreatRadar from '../components/dashboard/widgets/ThreatRadar';
import RiskScoreTimeline from '../components/dashboard/widgets/RiskScoreTimeline';
import TopThreatsWidget from '../components/dashboard/widgets/TopThreatsWidget';
import IncidentBurndown from '../components/dashboard/widgets/IncidentBurndown';

import {
  AlertTriangle, CheckCircle, Clock,
  Zap, Activity, RefreshCw, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const [trendDays, setTrendDays] = useState(7);
  const [fadeIn, setFadeIn] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [updatedAgo, setUpdatedAgo] = useState('just now');

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: incidentStats } = useIncidentStats();
  const { data: trend, isLoading: trendLoading } = useAlertTrend(trendDays);
  const { data: severityData, isLoading: severityLoading } = useSeverityDistribution();
  const { data: healthData, isLoading: healthLoading } = useDashboardStats();
  const { data: recentAlertsData, isLoading: recentAlertsLoading } = useRecentAlerts();

  const user = useAuthStore(state => state.user);

  const overview = stats?.overview || {};

  // Fade in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setFadeIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Refresh timestamp every 60s
  useEffect(() => {
    const interval = setInterval(() => setLastRefreshed(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Update "ago" text every 30s
  useEffect(() => {
    const updateAgo = () => {
      setUpdatedAgo(formatDistanceToNow(lastRefreshed, { addSuffix: false }));
    };
    updateAgo();
    const interval = setInterval(updateAgo, 30000);
    return () => clearInterval(interval);
  }, [lastRefreshed]);

  const firstName = useMemo(() => {
    if (!user?.full_name) return '';
    return user.full_name.split(' ')[0];
  }, [user?.full_name]);

  return (
    <div
      className={`space-y-6 max-w-[1600px] mx-auto transition-all duration-700 ease-out ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {/* ── PAGE HEADER ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">
            {getGreeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className="w-1.5 h-1.5 bg-[#2fbf71] rounded-full shadow-[0_0_6px_#2fbf71] animate-pulse" />
            <span className="font-mono">Updated {updatedAgo === '0 seconds' || updatedAgo === 'less than a minute' ? 'just now' : `${updatedAgo} ago`}</span>
          </div>
          <button
            onClick={() => setLastRefreshed(new Date())}
            className="p-2 rounded-full hover:bg-[var(--bg-surface-2)] border border-transparent hover:border-[var(--border-strong)] transition-all text-slate-400 hover:text-slate-200 focus-ring"
            title="Refresh Dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── INCIDENT BANNER ───────────────────────────────────────── */}
      {incidentStats?.active_incidents > 0 && (
        <div className="bg-[#f0384a]/8 border border-[#f0384a]/20 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#f0384a]/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            {/* Pulsing indicator */}
            <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-full bg-[#f0384a]/20" />
              <div className="w-2 h-2 rounded-full bg-[#f0384a] animate-ping" />
              <div className="absolute w-2 h-2 rounded-full bg-[#f0384a]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">
                {incidentStats.active_incidents} Active Incident{incidentStats.active_incidents > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Immediate attention required
              </p>
            </div>
          </div>
          <Link
            to="/incidents"
            className="relative z-10 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-[#f0384a]/40 hover:bg-[#f0384a]/10 text-[#f0384a] transition-colors whitespace-nowrap"
          >
            Investigate Now
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ── ROW 1 — Stats Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Total Alerts"
          value={overview.totalAlerts ?? '—'}
          icon={<AlertTriangle />}
          iconBg="bg-[var(--bg-surface-2)]"
          iconColor="text-slate-400"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Open Alerts"
          value={overview.openAlerts ?? '—'}
          icon={<AlertTriangle />}
          iconBg="bg-[#f5942e]/10"
          iconColor="text-[#f5942e]"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Critical"
          value={overview.criticalAlerts ?? '—'}
          icon={<Zap />}
          iconBg="bg-[#f0384a]/10"
          iconColor="text-[#f0384a]"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Resolved Today"
          value={overview.resolvedToday ?? '—'}
          icon={<CheckCircle />}
          iconBg="bg-[#2fbf71]/10"
          iconColor="text-[#2fbf71]"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Events (24h)"
          value={overview.eventsProcessed24h ?? '—'}
          icon={<Activity />}
          iconBg="bg-[#06b6d4]/10"
          iconColor="text-[#06b6d4]"
          isLoading={statsLoading}
        />
        <StatsCard
          title="MTTR (min)"
          value={overview.mttrMinutes !== undefined && overview.mttrMinutes !== null
            ? Math.round(overview.mttrMinutes)
            : '—'}
          icon={<Clock />}
          iconBg="bg-[#f0c419]/10"
          iconColor="text-[#f0c419]"
          isLoading={statsLoading}
        />
      </div>

      {/* ── ROW 2 — Hero Widgets ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 flex flex-col h-full">
          <div className="flex-1 flex flex-col h-full">
            <SecurityScoreCard />
          </div>
        </div>
        <div className="lg:col-span-1 flex flex-col h-full">
          <div className="flex-1 flex flex-col h-full">
            <LiveEventCounter />
          </div>
        </div>
        <div className="lg:col-span-1 flex flex-col h-full">
          <div className="flex-1 flex flex-col h-full">
            <AlertVelocityGauge />
          </div>
        </div>
      </div>

      {/* ── ROW 3 — Charts ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AlertTrendChart
            data={trend?.trend ?? []}
            isLoading={trendLoading}
            days={trendDays}
            onDaysChange={setTrendDays}
          />
        </div>
        <div className="lg:col-span-1">
          <MitreHeatmapWidget />
        </div>
      </div>

      {/* ── ROW 4 — Secondary Analytics ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <ThreatRadar />
        </div>
        <div className="lg:col-span-2">
          <RiskScoreTimeline />
        </div>
      </div>

      {/* ── ROW 5 — Operational Intelligence ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <TopThreatsWidget />
        </div>
        <div className="lg:col-span-1">
          <IncidentBurndown />
        </div>
        <div className="lg:col-span-1">
          <LiveAlertFeed />
        </div>
      </div>

      {/* ── ROW 6 — Recent Alerts ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4">
        <RecentAlerts 
          alerts={recentAlertsData?.alerts ?? []} 
          isLoading={recentAlertsLoading} 
        />
      </div>

      {/* ── FOOTER PADDING ────────────────────────────────────────── */}
      <div className="h-8" />
    </div>
  );
}
