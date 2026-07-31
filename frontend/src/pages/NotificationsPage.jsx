import React, { useState } from 'react';
import { useNotificationConfig, useNotificationStats } from '../hooks/useNotifications';
import SectionHeader from '../components/ui/SectionHeader';
import StatPill from '../components/ui/StatPill';
import SlackConfig from '../components/notifications/SlackConfig';
import EmailConfig from '../components/notifications/EmailConfig';
import NotificationRules from '../components/notifications/NotificationRules';
import NotificationHistory from '../components/notifications/NotificationHistory';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('configuration');
  const { data: config, isLoading: configLoading } = useNotificationConfig();
  const { data: stats } = useNotificationStats();

  const slackConfig = config?.channels?.find(c => c.channel_type === 'slack');
  const emailConfig = config?.channels?.find(c => c.channel_type === 'email');
  const isSlackConnected = slackConfig?.is_enabled;
  const isEmailConnected = emailConfig?.is_enabled;

  const TABS = [{ id: 'configuration', label: 'Configuration' }, { id: 'rules', label: 'Rules' }, { id: 'history', label: 'History' }];

  return (
    <div className="space-y-4">
      <SectionHeader title="Alert Notifications" subtitle="Real-time threat alerts via Slack and email" level="page" />

      {/* Status bar */}
      <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl px-5 py-3 flex items-center flex-wrap gap-3">
        <StatPill label="Sent Today" value={stats?.sentToday ?? '—'} color="success" />
        <StatPill label="Failed" value={stats?.failedToday ?? '—'} color={stats?.failedToday > 0 ? 'critical' : 'success'} />
        <StatPill label="Slack" value={isSlackConnected ? 'Connected' : 'Not configured'} color={isSlackConnected ? 'success' : 'slate'} />
        <StatPill label="Email" value={isEmailConnected ? 'Connected' : 'Not configured'} color={isEmailConnected ? 'success' : 'slate'} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1f2229]">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-[11px] font-medium transition-all relative ${
              activeTab === tab.id
                ? 'text-slate-100 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#06b6d4] after:rounded-full'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >{tab.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'configuration' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <SlackConfig config={slackConfig} />
            <EmailConfig config={emailConfig} />
          </div>
        )}
        {activeTab === 'rules' && <NotificationRules />}
        {activeTab === 'history' && <NotificationHistory />}
      </div>
    </div>
  );
}
