import React, { useState, useEffect } from 'react'
import { Shield, X } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'

export default function RuleFormModal({ isOpen, onClose, rule, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    severity: rule?.severity || 'medium',
    mitre_tactic: rule?.mitre_tactic || '',
    mitre_technique: rule?.mitre_technique || '',
    threshold: rule?.threshold || 1,
    time_window_minutes: rule?.time_window_minutes || 5,
    event_patterns: rule?.event_patterns ? (typeof rule.event_patterns === 'string' ? rule.event_patterns : JSON.stringify(rule.event_patterns, null, 2)) : ''
  })

  useEffect(() => {
    setFormData({
      name: rule?.name || '',
      description: rule?.description || '',
      severity: rule?.severity || 'medium',
      mitre_tactic: rule?.mitre_tactic || '',
      mitre_technique: rule?.mitre_technique || '',
      threshold: rule?.threshold || 1,
      time_window_minutes: rule?.time_window_minutes || 5,
      event_patterns: rule?.event_patterns ? (typeof rule.event_patterns === 'string' ? rule.event_patterns : JSON.stringify(rule.event_patterns, null, 2)) : ''
    })
  }, [rule, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    let patterns = formData.event_patterns
    try { patterns = JSON.parse(formData.event_patterns) } catch(err) {}
    onSubmit({ ...formData, event_patterns: patterns })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0e1015] border border-[#1f2229] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 shrink-0 border-b border-[#1f2229] px-6 flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="w-4 h-4 text-[#06b6d4] mr-2" />
            <span className="text-sm font-semibold text-slate-100">{rule ? 'Edit Rule' : 'Create Rule'}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">Name</label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">Description</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-20 resize-none bg-[#0e1015] border border-[#1f2229] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#06b6d4]/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">Severity</label>
              <Select 
                value={formData.severity}
                onChange={e => setFormData({ ...formData, severity: e.target.value })}
                className="w-full"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">MITRE Tactic</label>
              <Input 
                value={formData.mitre_tactic} 
                onChange={e => setFormData({ ...formData, mitre_tactic: e.target.value })} 
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">MITRE Technique</label>
              <Input 
                value={formData.mitre_technique} 
                onChange={e => setFormData({ ...formData, mitre_technique: e.target.value })} 
                className="w-full"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">Threshold</label>
              <Input 
                type="number"
                value={formData.threshold} 
                onChange={e => setFormData({ ...formData, threshold: parseInt(e.target.value, 10) })} 
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">Time Window (Minutes)</label>
            <Input 
              type="number"
              value={formData.time_window_minutes} 
              onChange={e => setFormData({ ...formData, time_window_minutes: parseInt(e.target.value, 10) })} 
              className="w-full"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">Event Patterns (JSON)</label>
            <textarea 
              value={formData.event_patterns}
              onChange={e => setFormData({ ...formData, event_patterns: e.target.value })}
              className="bg-[#05060a] border border-[#1f2229] rounded-xl p-4 font-mono text-[11px] text-slate-300 w-full resize-none h-48 focus:outline-none focus:border-[#06b6d4]/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#1f2229] px-6 py-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" isLoading={isLoading} onClick={handleSubmit}>{rule ? 'Save Changes' : 'Create Rule'}</Button>
        </div>
      </div>
    </div>
  )
}
