import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Shield, Bell, Settings } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import ProfileSettings from '../components/settings/ProfileSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import SystemSettings from '../components/settings/SystemSettings';
import SectionHeader from '../components/ui/SectionHeader';

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const activeTab = searchParams.get('tab') || 'profile';
  const handleTabChange = (tabId) => setSearchParams({ tab: tabId });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Settings, adminOnly: true }
  ];

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'US';

  return (
    <div className="space-y-4">
      <SectionHeader title="Settings" subtitle="Account preferences and system configuration" level="page" />

      <div className="grid lg:grid-cols-4 gap-6 items-start">
        {/* LEFT SIDEBAR */}
        <div className="lg:col-span-1 bg-[#0e1015] border border-[#1f2229] rounded-2xl p-2 h-fit sticky top-6">
          <nav className="space-y-0.5">
            {tabs.map(tab => {
              if (tab.adminOnly && user?.role !== 'admin') return null;
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#06b6d4]/10 text-[#06b6d4] font-medium'
                      : 'text-slate-500 hover:bg-[#191c24] hover:text-slate-300'
                  }`}
                >
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-[#06b6d4]" />}
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* User info at bottom */}
          <div className="border-t border-[#1f2229] mt-2 pt-2">
            <div className="flex items-center gap-2.5 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#06b6d4] to-purple-600 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-white">{initials}</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-200 truncate">{user?.username || 'User'}</div>
                <div className="text-[10px] text-slate-600 capitalize">{user?.role || 'analyst'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'system' && user?.role === 'admin' && <SystemSettings />}
        </div>
      </div>
    </div>
  );
}
