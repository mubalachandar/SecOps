import React from 'react';
import { Shield, Zap, Target, Lock, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';

export default function NotificationRules() {
  const rules = [
    {
      id: 1,
      name: "Critical Infrastructure Alert",
      description: "Notify immediately when a critical severity alert triggers on core database or production instances.",
      channels: ["Slack", "Email"],
      conditions: "Severity = Critical AND Resource IN (Production)",
      icon: <Target className="w-5 h-5 text-[#f0384a]" />
    },
    {
      id: 2,
      name: "Ransomware Detection Incident",
      description: "Page all on-call analysts when correlation engine detects ransomware patterns.",
      channels: ["Slack", "Email"],
      conditions: "Incident Created AND Pattern = Ransomware",
      icon: <Lock className="w-5 h-5 text-[#f5942e]" />
    },
    {
      id: 3,
      name: "High Privilege Escalation",
      description: "Alert Slack channel on IAM privilege escalation detections.",
      channels: ["Slack"],
      conditions: "Severity = High AND Category = Privilege Escalation",
      icon: <Shield className="w-5 h-5 text-[#06b6d4]" />
    },
    {
      id: 4,
      name: "Daily Digest",
      description: "Send a summary email of all Medium severity alerts from the past 24 hours.",
      channels: ["Email"],
      conditions: "Schedule = Daily AND Severity = Medium",
      icon: <AlertTriangle className="w-5 h-5 text-[#f0c419]" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#06b6d4]/10 border border-[#06b6d4]/20 rounded-xl p-5 flex gap-4">
        <div className="mt-1">
          <Zap className="w-6 h-6 text-[#06b6d4]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#06b6d4]">Custom Rules Engine Coming Soon</h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Currently, notification rules are hardcoded based on the toggle settings in the configuration tabs. 
            In an upcoming release, you will be able to build custom logical rules here to fine-tune exactly when and how your team is notified.
          </p>
        </div>
      </div>

      <Card title="Notification Rules" subtitle="Automated alert routing and escalation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60 pointer-events-none">
          {(rules ?? []).map((rule) => (
            <div key={rule.id} className="bg-[#0e1015] border border-[#1f2229] rounded-xl p-4 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                rule.id === 1 ? 'bg-[#f0384a]/10 border border-[#f0384a]/20' :
                rule.id === 2 ? 'bg-[#f5942e]/10 border border-[#f5942e]/20' :
                'bg-[#06b6d4]/10 border border-[#06b6d4]/20'
              }`}>
                {rule.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-200">{rule.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{rule.description}</div>
                <div className="flex gap-2 mt-2">
                  {rule.channels.map(ch => (
                    <span key={ch} className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border ${
                      ch === 'Slack' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-[#06b6d4]/10 border-[#06b6d4]/20 text-[#06b6d4]'
                    }`}>{ch}</span>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-[#1f2229]">
                  <div className="text-[10px] font-mono text-slate-500">
                    {rule.conditions}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-[#2fbf71]/10 border border-[#2fbf71]/20 text-[#2fbf71] shrink-0">Active</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
