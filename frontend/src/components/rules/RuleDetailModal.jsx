import React, { useState } from 'react'
import { X, Pencil, ExternalLink, Copy, Check } from 'lucide-react'
import { format } from 'date-fns'
import Badge from '../ui/Badge'
import RuleTestPanel from './RuleTestPanel'

export default function RuleDetailModal({ rule, isOpen, onClose, onEdit }) {
  const [copied, setCopied] = useState(false)

  if (!rule) return null

  const getTacticName = (tacticId) => {
    const map = {
      'TA0001': 'Initial Access',
      'TA0002': 'Execution',
      'TA0003': 'Persistence',
      'TA0004': 'Privilege Escalation',
      'TA0005': 'Defense Evasion',
      'TA0006': 'Credential Access',
      'TA0007': 'Discovery',
      'TA0008': 'Lateral Movement',
      'TA0009': 'Collection',
      'TA0010': 'Exfiltration',
      'TA0040': 'Impact'
    }
    return map[tacticId] || tacticId
  }

  const patternsText = JSON.stringify(rule.event_patterns, null, 2)
  const copy = () => {
    navigator.clipboard.writeText(patternsText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen && rule ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-[#0e1015] border-l border-[#1f2229] flex flex-col transition-transform duration-300 ease-out ${isOpen && rule ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-14 shrink-0 border-b border-[#1f2229] px-5 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-100 truncate">{rule.name}</div>
            <div className="font-mono text-[10px] text-slate-600 mt-0.5">{rule.rule_id || rule.id}</div>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <Badge variant={rule.is_active ? 'success' : 'neutral'}>
              {rule.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <button onClick={() => onEdit(rule)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#191c24] text-slate-500 hover:text-slate-200 transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#191c24] text-slate-500 hover:text-slate-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Section 1 - Overview */}
          <div className="bg-[#13151b] border border-[#1f2229] rounded-xl p-4 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Severity</div>
              <Badge variant={rule.severity} className="capitalize">{rule.severity}</Badge>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Status</div>
              <div className={`text-sm font-medium ${rule.is_active ? 'text-[#2fbf71]' : 'text-slate-500'}`}>
                {rule.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Threshold</div>
              <div className="text-[11px] text-slate-300">{rule.threshold} events</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Time Window</div>
              <div className="text-[11px] text-slate-300">{rule.time_window_minutes} minutes</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Created</div>
              <div className="text-[11px] text-slate-300">{rule.created_at ? format(new Date(rule.created_at), 'PPpp') : '—'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Updated</div>
              <div className="text-[11px] text-slate-300">{rule.updated_at ? format(new Date(rule.updated_at), 'PPpp') : '—'}</div>
            </div>
          </div>

          {/* Section 2 - MITRE Coverage */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#06b6d4]/8 border border-[#06b6d4]/15 rounded-xl p-4 text-center flex flex-col items-center justify-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Tactic</div>
              <div className="font-mono text-xl font-bold text-[#06b6d4]">{rule.mitre_tactic}</div>
              <div className="text-xs text-slate-400 mt-1">{getTacticName(rule.mitre_tactic)}</div>
              <a href="https://attack.mitre.org/tactics/" target="_blank" rel="noreferrer" className="text-[10px] text-slate-600 hover:text-slate-400 mt-2 flex items-center gap-1 transition-colors">
                attack.mitre.org <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="bg-purple-500/8 border border-purple-500/15 rounded-xl p-4 text-center flex flex-col items-center justify-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Technique</div>
              <div className="font-mono text-xl font-bold text-purple-400">{rule.mitre_technique}</div>
              <a href={`https://attack.mitre.org/techniques/${(rule.mitre_technique || '').replace('.', '/')}`} target="_blank" rel="noreferrer" className="text-[10px] text-slate-600 hover:text-slate-400 mt-3 flex items-center gap-1 transition-colors">
                attack.mitre.org <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Section 3 - Event Patterns */}
          <div className="bg-[#13151b] border border-[#1f2229] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f2229]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Event Patterns</span>
              <button onClick={copy} className="text-[10px] text-slate-600 hover:text-slate-400 flex items-center gap-1 transition-colors">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <pre className="bg-[#05060a] text-[11px] font-mono text-slate-300 p-4 overflow-x-auto leading-relaxed max-h-48">{patternsText}</pre>
          </div>

          {/* Section 4 - RuleTestPanel */}
          <RuleTestPanel rule={rule} />
        </div>
      </div>
    </>
  )
}
