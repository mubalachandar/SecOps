import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const DEFAULT_PREFS = {
  criticalAlerts: true,
  highSeverity: true,
  newRuleTriggers: false,
  weeklyReport: false,
  systemHealth: true,
  aiAnalysis: false
};

const SETTINGS_LIST = [
  { id: 'criticalAlerts', name: 'Critical Alerts', desc: 'Get notified for critical severity alerts' },
  { id: 'highSeverity', name: 'High Severity Alerts', desc: 'Notifications for high severity detections' },
  { id: 'newRuleTriggers', name: 'New Detection Rule Triggers', desc: 'Alert when a rule matches for first time' },
  { id: 'weeklyReport', name: 'Weekly Security Report', desc: 'Summary of weekly threat landscape' },
  { id: 'systemHealth', name: 'System Health Alerts', desc: 'Notify when system components degrade' },
  { id: 'aiAnalysis', name: 'AI Analysis Complete', desc: 'Notify when Gemini analysis finishes' }
];

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  useEffect(() => {
    const stored = localStorage.getItem('secops_notification_prefs');
    if (stored) {
      try { setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) }); } catch(e) {}
    }
  }, []);

  const handleToggle = (id) => setPrefs(prev => ({ ...prev, [id]: !prev[id] }));

  const handleSave = () => {
    localStorage.setItem('secops_notification_prefs', JSON.stringify(prefs));
    toast.success('Notification preferences saved');
  };

  return (
    <Card title="Notification Preferences">
      <div className="space-y-0">
        {SETTINGS_LIST.map(setting => (
          <div key={setting.id} className="flex items-center justify-between py-4 border-b border-[#1f2229] last:border-0">
            <div>
              <div className="text-sm font-medium text-slate-200">{setting.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{setting.desc}</div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle(setting.id)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ml-4 ${prefs[setting.id] ? 'bg-[#06b6d4]' : 'bg-[#191c24]'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${prefs[setting.id] ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
      <Button variant="primary" className="w-full mt-4" onClick={handleSave}>Save Preferences</Button>
      <div className="bg-[#06b6d4]/8 border border-[#06b6d4]/15 rounded-lg px-4 py-3 mt-4 flex gap-2 items-start">
        <Info className="w-4 h-4 text-[#06b6d4] shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-400">Notification delivery requires Slack or email to be configured in the Notifications page.</p>
      </div>
    </Card>
  );
}
