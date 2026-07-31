import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import AlertsPage from './pages/AlertsPage'
import CloudTrailPage from './pages/CloudTrailPage'
import RulesPage from './pages/RulesPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import ChatPage from './pages/ChatPage'
import MitrePage from './pages/MitrePage'
import IncidentsPage from './pages/IncidentsPage'
import ReportsPage from './pages/ReportsPage'
import ThreatMapPage from './pages/ThreatMapPage'
import ThreatIntelPage from './pages/ThreatIntelPage'
import NotificationsPage from './pages/NotificationsPage'
import { useThemeStore } from './store/themeStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
      refetchOnWindowFocus: false,  // prevent jarring data refresh when switching tabs
      gcTime: 5 * 60 * 1000,       // keep unused data in cache for 5 minutes
    }
  }
})

function App() {
  const theme = useThemeStore(state => state.theme);

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className={theme === "dark" ? "dark" : "light"}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/alerts" element={<ErrorBoundary><AlertsPage /></ErrorBoundary>} />
                <Route path="/incidents" element={<ErrorBoundary><IncidentsPage /></ErrorBoundary>} />
                <Route path="/cloudtrail" element={<ErrorBoundary><CloudTrailPage /></ErrorBoundary>} />
                <Route path="/rules" element={<ErrorBoundary><RulesPage /></ErrorBoundary>} />
                <Route path="/analytics" element={<ErrorBoundary><AnalyticsPage /></ErrorBoundary>} />
                <Route path="/threat-map" element={<ErrorBoundary><ThreatMapPage /></ErrorBoundary>} />
                <Route path="/threat-intel" element={<ErrorBoundary><ThreatIntelPage /></ErrorBoundary>} />
                <Route path="/notifications" element={<ErrorBoundary><NotificationsPage /></ErrorBoundary>} />
                <Route path="/chat" element={<ErrorBoundary><ChatPage /></ErrorBoundary>} />
                <Route path="/mitre" element={<ErrorBoundary><MitrePage /></ErrorBoundary>} />
                <Route path="/reports" element={<ErrorBoundary><ReportsPage /></ErrorBoundary>} />
                <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
              </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155'
          }
        }}
      />
    </QueryClientProvider>
  )
}

export default App
