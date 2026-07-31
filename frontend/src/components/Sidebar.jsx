import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useLogout } from '../hooks/useAuth';
import { useDashboardStats } from '../hooks/useAnalytics';
import { useIncidentStats } from '../hooks/useIncidents';
import { useUIStore } from '../store/uiStore';
import logoImg from '../assets/logo.jpg';
import {
  LayoutDashboard, AlertTriangle, Activity,
  Shield, BarChart3, LogOut, Settings,
  ChevronLeft, ChevronRight, MessageSquare,
  Target, FileText, Globe, Database, Bell,
  Layers, X, Menu
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────────
 * Navigation groups — mirrors the IA hierarchy of the platform.
 * Each group renders a small label above its items (Linear-style).
 * ──────────────────────────────────────────────────────────────────── */
const navGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true }
    ]
  },
  {
    label: 'DETECTION',
    items: [
      { path: '/alerts', label: 'Alerts', icon: AlertTriangle, badgeKey: 'openAlerts' },
      { path: '/incidents', label: 'Incidents', icon: Layers, badgeKey: 'activeIncidents' },
      { path: '/cloudtrail', label: 'CloudTrail', icon: Activity },
      { path: '/rules', label: 'Detection Rules', icon: Shield }
    ]
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { path: '/mitre', label: 'MITRE ATT&CK', icon: Target },
      { path: '/threat-map', label: 'Threat Map', icon: Globe },
      { path: '/threat-intel', label: 'Threat Intel', icon: Database },
      { path: '/chat', label: 'AI Assistant', icon: MessageSquare }
    ]
  },
  {
    label: 'PLATFORM',
    items: [
      { path: '/analytics', label: 'Analytics', icon: BarChart3 },
      { path: '/reports', label: 'Reports', icon: FileText },
      { path: '/notifications', label: 'Notifications', icon: Bell },
      { path: '/settings', label: 'Settings', icon: Settings }
    ]
  }
];


export default function Sidebar({ isCollapsed, onToggle, isMobileMenuOpen, onMobileClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const wsConnected = useUIStore(state => state.wsConnected);
  const logout = useLogout();

  /* Badge data — wrapped in try/catch so a hook failure never crashes the sidebar */
  let openAlerts = 0;
  let activeIncidents = 0;

  try {
    const statsResult = useDashboardStats();
    openAlerts = statsResult?.data?.openAlerts ?? statsResult?.data?.open_alerts ?? 0;
  } catch {
    /* silently ignore */
  }

  try {
    const incidentResult = useIncidentStats();
    activeIncidents = incidentResult?.data?.active ?? incidentResult?.data?.activeIncidents ?? 0;
  } catch {
    /* silently ignore */
  }

  const badgeCounts = { openAlerts, activeIncidents };

  const handleLogout = () => {
    logout();
  };

  const handleMobileClose = () => {
    if (window.innerWidth < 768 && onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <div
      className={[
        'flex flex-col h-screen fixed left-0 top-0 z-50',
        'transition-all duration-200 ease-in-out',
        /* Background & border */
        'bg-white dark:bg-[#0e1015]',
        'border-r border-gray-200 dark:border-[#1f2229]',
        /* Desktop widths */
        isCollapsed ? 'md:w-14' : 'md:w-60',
        /* Mobile visibility */
        isMobileMenuOpen
          ? 'w-60 translate-x-0'
          : 'w-60 -translate-x-full md:translate-x-0'
      ].join(' ')}
    >
      {/* ═══════════ LOGO AREA ═══════════ */}
      <div className="h-14 border-b border-gray-200 dark:border-[#1f2229] flex items-center px-3 relative shrink-0">
        {/* Logomark */}
        <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
          <img src={logoImg} alt="SecOps AI Copilot" className="w-full h-full object-cover" />
        </div>

        {/* Text stack — hidden when collapsed */}
        {!isCollapsed && (
          <div className="ml-2.5 min-w-0 overflow-hidden">
            <div className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">SecOps</div>
            <div className="text-[10px] font-medium text-gray-400 dark:text-slate-500 tracking-wider uppercase leading-tight">AI Copilot</div>
          </div>
        )}

        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="md:hidden absolute right-3 p-1 rounded-md text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggle}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-100 dark:bg-[#1f2229] border border-gray-200 dark:border-[#2a2e38] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 items-center justify-center cursor-pointer transition-colors z-50"
        >
          {isCollapsed
            ? <ChevronRight className="w-3 h-3" />
            : <ChevronLeft className="w-3 h-3" />
          }
        </button>
      </div>

      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navGroups.map((group, groupIdx) => (
          <div key={group.label}>
            {/* Section label — hidden when collapsed */}
            {!isCollapsed && (
              <div
                className={[
                  'text-[10px] font-semibold tracking-[0.08em] uppercase',
                  'text-gray-400 dark:text-slate-600',
                  'px-5 mb-1',
                  groupIdx === 0 ? 'mt-2' : 'mt-5'
                ].join(' ')}
              >
                {group.label}
              </div>
            )}

            {/* Spacer when collapsed between groups */}
            {isCollapsed && groupIdx > 0 && <div className="mt-3" />}

            {group.items.map((item) => {
              const Icon = item.icon;
              const badgeCount = item.badgeKey ? (badgeCounts[item.badgeKey] || 0) : 0;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  title={isCollapsed ? item.label : undefined}
                  onClick={handleMobileClose}
                  className={({ isActive }) => [
                    'flex items-center px-3 py-2 mx-2 rounded-lg relative group',
                    'transition-all duration-[120ms]',
                    isActive
                      ? 'bg-accent/8 dark:bg-accent/10'
                      : 'hover:bg-gray-100 dark:hover:bg-[#191c24]',
                    isCollapsed ? 'justify-center' : ''
                  ].join(' ')}
                >
                  {({ isActive }) => (
                    <>
                      {/* Left active indicator bar — 2px wide, 16px tall, centered vertically */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-accent" />
                      )}

                      {/* Icon */}
                      <div className={[
                        'flex items-center justify-center shrink-0',
                        isCollapsed ? 'w-full' : 'w-5'
                      ].join(' ')}>
                        <Icon className={[
                          'w-[18px] h-[18px]',
                          isActive
                            ? 'text-accent'
                            : 'text-gray-400 dark:text-slate-600 group-hover:text-gray-500 dark:group-hover:text-slate-400'
                        ].join(' ')} />
                      </div>

                      {/* Label */}
                      {!isCollapsed && (
                        <span className={[
                          'text-sm font-medium ml-3 flex-1 whitespace-nowrap overflow-hidden text-ellipsis',
                          isActive
                            ? 'text-gray-900 dark:text-slate-100'
                            : 'text-gray-500 dark:text-slate-500 group-hover:text-gray-700 dark:group-hover:text-slate-300'
                        ].join(' ')}>
                          {item.label}
                        </span>
                      )}

                      {/* Badge — expanded mode shows count pill, collapsed shows dot overlay */}
                      {badgeCount > 0 && !isCollapsed && (
                        <span className="ml-auto min-w-5 h-5 rounded-full bg-severity-critical/15 dark:bg-severity-critical/15 text-severity-critical text-[10px] font-semibold flex items-center justify-center px-1.5">
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                      )}
                      {badgeCount > 0 && isCollapsed && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-severity-critical" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ═══════════ BOTTOM SECTION ═══════════ */}
      <div className="border-t border-gray-200 dark:border-[#1f2229] p-2 shrink-0">
        {/* Logout */}
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className={[
            'flex items-center px-3 py-2 rounded-lg w-full',
            'transition-all duration-[120ms]',
            'text-gray-400 dark:text-slate-600',
            'hover:text-red-500 dark:hover:text-red-400',
            'hover:bg-red-50 dark:hover:bg-red-400/5',
            isCollapsed ? 'justify-center' : ''
          ].join(' ')}
        >
          <div className={['flex items-center justify-center shrink-0', isCollapsed ? 'w-full' : 'w-5'].join(' ')}>
            <LogOut className="w-[18px] h-[18px]" />
          </div>
          {!isCollapsed && (
            <span className="text-sm font-medium ml-3 flex-1 text-left whitespace-nowrap">Logout</span>
          )}
        </button>

        {/* WebSocket status */}
        <div className={['mt-2 flex items-center', isCollapsed ? 'justify-center px-0' : 'px-3'].join(' ')}>
          <div className="flex items-center gap-2">
            <div
              className={[
                'w-1.5 h-1.5 rounded-full shrink-0',
                wsConnected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
              ].join(' ')}
            />
            {!isCollapsed && (
              <span className="text-[10px] font-medium text-gray-400 dark:text-slate-600">
                {wsConnected ? 'Real-time: Active' : 'Real-time: Connecting'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
