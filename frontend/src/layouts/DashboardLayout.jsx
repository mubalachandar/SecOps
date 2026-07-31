import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import ErrorBoundary from '../components/ErrorBoundary';
import GlobalSearch from '../components/search/GlobalSearch';
import { useUIStore } from '../store/uiStore';
import { useWebSocket } from '../hooks/useWebSocket';

const pageTitles = {
  '/': { title: 'Dashboard' },
  '/alerts': { title: 'Alerts Management' },
  '/incidents': { title: 'Incident Response' },
  '/cloudtrail': { title: 'CloudTrail' },
  '/rules': { title: 'Detection Rules' },
  '/analytics': { title: 'Analytics' },
  '/chat': { title: 'AI Assistant' },
  '/mitre': { title: 'MITRE ATT&CK Matrix' },
  '/threat-map': { title: 'Global Threat Map' },
  '/reports': { title: 'Reports' },
  '/threat-intel': { title: 'Threat Intelligence' },
  '/notifications': { title: 'Notifications' },
  '/settings': { title: 'Settings' }
};

export default function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isConnected } = useWebSocket();

  const currentPath = location.pathname;
  const { title } = pageTitles[currentPath] || { title: 'SecOps Copilot' };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const showSearch = useUIStore(state => state.showSearch);
  const openSearch = useUIStore(state => state.openSearch);
  const closeSearch = useUIStore(state => state.closeSearch);
  const setWsConnected = useUIStore(state => state.setWsConnected);

  useEffect(() => {
    setWsConnected(isConnected);
  }, [isConnected, setWsConnected]);

  /* ── Ctrl+K global search shortcut ── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        openSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSearch]);

  /* ── Close mobile menu on route change ── */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  /* ── Compute sidebar width for content offset ── */
  const sidebarWidth = isCollapsed ? '3.5rem' : '15rem'; /* w-14 = 56px, w-60 = 240px */

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#08090c] overflow-hidden">
      {/* Mobile Sidebar Overlay — with backdrop blur and fade */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content wrapper — offset by sidebar width */}
      <div
        className="flex-1 flex flex-col overflow-hidden transition-[margin-left] duration-200 ease-in-out ml-0"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? sidebarWidth : undefined
        }}
      >
        <TopBar
          title={title}
          onMenuToggle={toggleMobileMenu}
        />

        <main
          key={location.pathname}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 animate-fadeIn"
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>

        <GlobalSearch isOpen={showSearch} onClose={closeSearch} />
      </div>
    </div>
  );
}
