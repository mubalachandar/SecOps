import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, CheckCircle, User as UserIcon, Shield, HelpCircle, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useAuth';
import { useUIStore } from '../store/uiStore';
import { formatDistanceToNow } from 'date-fns';
import ThemeToggle from './ui/ThemeToggle';

export default function TopBar({ title, onMenuToggle }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const logout = useLogout();

  const openSearch = useUIStore(state => state.openSearch);
  const showNotifications = useUIStore(state => state.showNotifications);
  const toggleNotifications = useUIStore(state => state.toggleNotifications);
  const setNotificationsOpen = useUIStore(state => state.setNotificationsOpen);

  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setNotificationsOpen]);

  /* ── Fetch notifications ── */
  const { data: alertsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => alertsApi.getAlerts({ limit: 5, status: 'open' }),
    refetchInterval: 30000
  });

  const alerts = alertsData?.data || [];
  const alertCount = alertsData?.total || 0;

  /* ── Helpers ── */
  const getUserInitials = () => {
    if (user?.full_name) {
      const parts = user.full_name.split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0][0].toUpperCase();
    }
    return 'A';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-amber-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'analyst': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className="h-14 bg-white/80 dark:bg-[#0e1015]/80 backdrop-blur-xl border-b border-gray-200 dark:border-[#1f2229] sticky top-0 z-40 flex items-center justify-between px-4 md:px-6">
      {/* ══════════ LEFT SIDE ══════════ */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-[#191c24] rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Page title — just text, no subtitle */}
        <h1 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{title}</h1>
      </div>

      {/* ══════════ RIGHT SIDE — exactly 4 items ══════════ */}
      <div className="flex items-center gap-2">
        {/* 1. Search pill */}
        <button
          onClick={openSearch}
          className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-[#13151b] border border-gray-200 dark:border-[#1f2229] rounded-lg px-3 h-8 text-xs text-gray-500 dark:text-slate-500 hover:border-gray-300 dark:hover:border-[#2a2e38] hover:text-gray-600 dark:hover:text-slate-400 cursor-pointer w-36 transition-colors"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="text-[10px] text-gray-400 dark:text-slate-600 font-sans">⌘K</kbd>
        </button>
        {/* Mobile search — icon only */}
        <button
          onClick={openSearch}
          className="md:hidden w-8 h-8 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* 2. Notifications bell */}
        <div className="relative flex items-center" ref={notifRef}>
          <button
            onClick={toggleNotifications}
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#13151b] border border-gray-200 dark:border-[#1f2229] hover:border-gray-300 dark:hover:border-[#2a2e38] flex items-center justify-center text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-severity-critical text-white text-[9px] font-bold flex items-center justify-center">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-10 w-72 md:w-80 z-50 bg-white dark:bg-[#13151b] border border-gray-200 dark:border-[#1f2229] rounded-xl shadow-2xl shadow-black/5 dark:shadow-black/50 overflow-hidden animate-scaleIn">
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-[#1f2229]">
                <span className="text-gray-900 dark:text-slate-100 font-semibold text-sm">Notifications</span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => { setNotificationsOpen(false); navigate('/alerts'); }}
                      className="px-4 py-3 border-b border-gray-50 dark:border-[#1f2229] hover:bg-gray-50 dark:hover:bg-[#191c24] cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${getSeverityColor(alert.severity)}`} />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 dark:text-slate-200 font-medium leading-tight truncate">
                            {alert.title}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                            {formatDistanceToNow(new Date(alert.created_at || alert.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                    <span className="text-gray-400 dark:text-slate-500 text-xs">No open alerts</span>
                  </div>
                )}
              </div>

              <div className="px-4 py-3 text-center border-t border-gray-100 dark:border-[#1f2229]">
                <button
                  onClick={() => { setNotificationsOpen(false); navigate('/alerts'); }}
                  className="text-accent text-xs hover:text-accent-hover font-medium transition-colors"
                >
                  View all alerts
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Theme toggle */}
        <ThemeToggle size="sm" />

        {/* 4. User avatar */}
        <div className="relative flex items-center" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:ring-2 hover:ring-accent/30 transition-all ml-1"
          >
            {getUserInitials()}
          </button>

          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-10 w-56 z-50 bg-white dark:bg-[#13151b] border border-gray-200 dark:border-[#1f2229] rounded-xl shadow-2xl shadow-black/5 dark:shadow-black/50 overflow-hidden animate-scaleIn">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-[#1f2229] flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white text-base font-bold mb-2">
                  {getUserInitials()}
                </div>
                <div className="text-gray-900 dark:text-slate-100 text-sm font-medium w-full truncate">{user?.full_name || 'User'}</div>
                <div className="text-gray-500 dark:text-slate-400 text-xs w-full truncate mb-2">{user?.email || 'user@example.com'}</div>
                <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getRoleColor(user?.role)}`}>
                  {user?.role || 'User'}
                </div>
              </div>

              <div className="py-1">
                <div
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                  className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#191c24] cursor-pointer text-gray-700 dark:text-slate-300 text-sm transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  My Profile
                </div>
                <div
                  onClick={() => { setShowUserMenu(false); navigate('/settings?tab=security'); }}
                  className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#191c24] cursor-pointer text-gray-700 dark:text-slate-300 text-sm transition-colors"
                >
                  <Shield className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  Security Settings
                </div>
                <div
                  onClick={() => { setShowUserMenu(false); navigate('/notifications'); }}
                  className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#191c24] cursor-pointer text-gray-700 dark:text-slate-300 text-sm transition-colors"
                >
                  <Bell className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  Notification Preferences
                </div>

                <div className="border-t border-gray-100 dark:border-[#1f2229] my-1" />
                <div
                  onClick={() => { setShowUserMenu(false); logout(); }}
                  className="px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer text-red-600 dark:text-red-400 text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
