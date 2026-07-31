import React, { useState, useEffect } from 'react';
import { Mail, AlertTriangle, Plus, X } from 'lucide-react';
import { useUpdateEmailConfig, useTestEmail } from '../../hooks/useNotifications';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${checked ? 'bg-[#06b6d4]' : 'bg-[#191c24]'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default function EmailConfig({ config }) {
  const [formData, setFormData] = useState({
    isEnabled: false,
    recipients: [],
    notifyCritical: true,
    notifyHigh: true,
    notifyMedium: false,
    notifyOnIncident: true,
  });
  
  const [newEmail, setNewEmail] = useState('');

  const { mutate: updateConfig, isPending: isSaving } = useUpdateEmailConfig();
  const { mutate: testEmail, isPending: isTesting } = useTestEmail();

  useEffect(() => {
    if (config) {
      setFormData({
        isEnabled: config.is_enabled ?? false,
        recipients: config.config?.recipients || [],
        notifyCritical: config.notify_critical ?? true,
        notifyHigh: config.notify_high ?? true,
        notifyMedium: config.notify_medium ?? false,
        notifyOnIncident: config.notify_on_incident ?? true,
      });
    }
  }, [config]);

  const handleSave = () => {
    updateConfig(formData);
  };

  const handleAddEmail = (e) => {
    e?.preventDefault();
    if (!newEmail || !newEmail.includes('@')) return;
    if (formData.recipients.includes(newEmail)) {
      setNewEmail('');
      return;
    }
    
    setFormData({
      ...formData,
      recipients: [...formData.recipients, newEmail]
    });
    setNewEmail('');
  };

  const handleRemoveEmail = (emailToRemove) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.filter(email => email !== emailToRemove)
    });
  };

  const isConfigured = !!formData.isEnabled;

  const STEPS = [
    'Create a SendGrid account at sendgrid.com',
    'Generate an API Key with Mail Send permissions',
    'Add to your backend .env as SENDGRID_API_KEY',
    'Add your verified sender email as SENDGRID_FROM_EMAIL',
    'Restart the backend server'
  ];

  const PREFS = [
    { key: 'notifyCritical', label: 'Critical Alerts', desc: 'Immediate notifications for critical severity' },
    { key: 'notifyHigh', label: 'High Severity Alerts', desc: 'Notifications for high severity detections' },
    { key: 'notifyOnIncident', label: 'Security Incidents', desc: 'Notify when correlated incidents are detected' },
    { key: 'notifyMedium', label: 'Medium Alerts', desc: 'Medium severity (may be noisy)' },
  ];

  return (
    <Card title="Email Integration">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[#06b6d4] flex items-center justify-center">
          <Mail className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-100">SendGrid Email</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
          isConfigured
            ? 'bg-[#2fbf71]/10 border-[#2fbf71]/20 text-[#2fbf71]'
            : 'bg-[#191c24] border-[#2a2e38] text-slate-500'
        }`}>{isConfigured ? 'Connected' : 'Not Configured'}</span>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between py-4 border-b border-[#1f2229]">
        <div>
          <div className="text-sm font-medium text-slate-200">Enable Email Notifications</div>
          <div className="text-[11px] text-slate-600 mt-0.5">Send alerts via SendGrid to security analysts.</div>
        </div>
        <Toggle checked={formData.isEnabled} onChange={(v) => setFormData(f => ({ ...f, isEnabled: v }))} />
      </div>

      {/* Setup guide */}
      {!isConfigured && (
        <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl p-4 my-4">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Setup Guide</span>
          </div>
          <div className="space-y-3">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#06b6d4]/15 border border-[#06b6d4]/25 text-[#06b6d4] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
          <div className="bg-amber-500/8 border border-amber-500/15 rounded-lg px-3 py-2 flex gap-2 mt-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-400">Add API key and verified sender to .env then restart.</p>
          </div>
        </div>
      )}

      {/* Recipients */}
      <div className="py-4 border-b border-[#1f2229]">
        <label className="text-[11px] uppercase tracking-wider text-slate-600 block mb-2 font-semibold">Recipients</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {formData.recipients.map(email => (
            <span key={email} className="bg-[#191c24] border border-[#2a2e38] text-slate-300 text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-2">
              {email}
              <button type="button" onClick={() => handleRemoveEmail(email)} className="text-slate-600 hover:text-[#f0384a] transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {formData.recipients.length === 0 && (
            <span className="text-[11px] text-slate-500 italic py-1.5">No recipients added yet</span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="analyst@company.com" />
          </div>
          <Button variant="outline" size="sm" onClick={handleAddEmail}><Plus className="w-3.5 h-3.5" /> Add</Button>
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-0">
        {PREFS.map(pref => (
          <div key={pref.key} className="flex items-center justify-between py-3.5 border-b border-[#1f2229] last:border-0">
            <div>
              <div className="text-sm text-slate-200">{pref.label}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">{pref.desc}</div>
            </div>
            <Toggle checked={formData[pref.key]} onChange={(v) => setFormData(f => ({ ...f, [pref.key]: v }))} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-[#1f2229]">
        <Button variant="outline" size="sm" isLoading={isSaving} onClick={handleSave}>Save Configuration</Button>
        <Button variant="ghost" size="sm" disabled={!isConfigured || formData.recipients.length === 0} isLoading={isTesting} onClick={() => testEmail()}>Send Test</Button>
      </div>
    </Card>
  );
}
