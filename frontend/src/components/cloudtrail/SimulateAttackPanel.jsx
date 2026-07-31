import React from 'react'
import { AlertTriangle, Target, Zap } from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

const scenarios = [
  {
    id: 'root_login',
    label: 'Root Account Login',
    description: 'Simulates console login from root account with unusual source IP',
    severity: 'critical',
    mitre: 'TA0001 — Initial Access',
    icon: '🔑',
    color: 'red'
  },
  {
    id: 'brute_force',
    label: 'Brute Force Attack',
    description: 'Simulates 6 failed login attempts in 5 minutes',
    severity: 'high',
    mitre: 'TA0006 — Credential Access',
    icon: '🔨',
    color: 'amber'
  },
  {
    id: 'data_exfil',
    label: 'Data Exfiltration',
    description: 'Simulates S3 bucket made public + mass GetObject calls',
    severity: 'critical',
    mitre: 'TA0010 — Exfiltration',
    icon: '📤',
    color: 'red'
  },
  {
    id: 'privilege_escalation',
    label: 'Privilege Escalation',
    description: 'Simulates IAM user creation + admin policy attachment',
    severity: 'high',
    mitre: 'TA0004 — Privilege Escalation',
    icon: '⬆️',
    color: 'amber'
  },
  {
    id: 'defense_evasion',
    label: 'Defense Evasion',
    description: 'Simulates CloudTrail logging disabled + security group modified',
    severity: 'critical',
    mitre: 'TA0005 — Defense Evasion',
    icon: '🛡️',
    color: 'orange'
  }
]

export default function SimulateAttackPanel({ onSimulate, isLoading }) {
  const handleSimulate = async (id) => {
    try { await onSimulate(id) } catch(e) {}
  }

  return (
    <div className="bg-[#0e1015] border border-[#1f2229] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#06b6d4]" />
          <span className="text-sm font-semibold text-slate-100">Attack Simulation</span>
          <span className="text-[11px] text-slate-500 ml-1">Generate realistic CloudTrail events</span>
        </div>
        <div className="bg-[#f5942e]/10 border border-[#f5942e]/20 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-[#f5942e]" />
          <span className="text-[10px] text-[#f5942e] font-medium">Generates real alerts</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="bg-[#13151b] border border-[#1f2229] rounded-xl p-4 hover:border-[#2a2e38] transition-all cursor-pointer flex flex-col">
            <div className="flex items-start justify-between">
              <span className="text-2xl">{scenario.icon}</span>
              <Badge variant={scenario.severity} size="sm">{scenario.severity}</Badge>
            </div>
            <div className="mt-2 flex-1">
              <div className="text-sm font-semibold text-slate-200">{scenario.label}</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{scenario.description}</div>
            </div>
            <div className="mt-2">
              <span className="font-mono text-[10px] text-[#06b6d4] bg-[#06b6d4]/8 px-2 py-0.5 rounded inline-block">{scenario.mitre}</span>
            </div>
            <div className="mt-3">
              <Button variant="outline" size="sm" className="w-full" isLoading={isLoading} onClick={() => handleSimulate(scenario.id)}>
                {isLoading ? 'Simulating…' : 'Run Simulation'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
