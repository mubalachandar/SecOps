import React from 'react'
import { Pencil, Trash2, Shield } from 'lucide-react'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'

export default function RulesTable({
  rules,
  isLoading,
  onRuleClick,
  onToggle,
  onEdit,
  onDelete,
  pagination,
  onPageChange
}) {
  const { page, total, totalPages } = pagination

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

  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-[#0e1015] border-b border-[#1f2229]">
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left w-16">Status</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left">Name</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left w-24">Severity</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left w-44 hidden md:table-cell">MITRE Tactic</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left w-32 hidden lg:table-cell">Threshold</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-[#1f2229]">
                  <td className="px-5 py-3.5"><div className="h-5 w-9 bg-[#1f2229] rounded-full animate-pulse"></div></td>
                  <td className="px-5 py-3.5">
                    <div className="h-4 bg-[#1f2229] rounded w-3/4 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-[#1f2229] rounded w-1/2 animate-pulse"></div>
                  </td>
                  <td className="px-5 py-3.5"><div className="h-5 bg-[#1f2229] rounded w-16 animate-pulse"></div></td>
                  <td className="px-5 py-3.5 hidden md:table-cell"><div className="h-4 bg-[#1f2229] rounded w-20 animate-pulse"></div></td>
                  <td className="px-5 py-3.5 hidden lg:table-cell"><div className="h-4 bg-[#1f2229] rounded w-16 animate-pulse"></div></td>
                  <td className="px-5 py-3.5"><div className="h-6 bg-[#1f2229] rounded w-16 animate-pulse ml-auto"></div></td>
                </tr>
              ))
            ) : rules && rules.length > 0 ? (
              rules.map(rule => (
                <tr 
                  key={rule.id}
                  className={`border-b border-[#1f2229] transition-colors ${rule.is_active ? 'hover:bg-[#191c24]' : 'opacity-40 hover:bg-[#191c24]'}`}
                >
                  <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onToggle(rule.id, !rule.is_active)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${rule.is_active ? 'bg-[#06b6d4]' : 'bg-[#191c24]'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${rule.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-5 py-3.5 cursor-pointer" onClick={() => onRuleClick(rule)}>
                    <div className="text-sm font-medium text-slate-200">{rule.name}</div>
                    <div className="text-[11px] text-slate-600 truncate max-w-[260px]">{rule.description}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={rule.severity} className="capitalize">{rule.severity}</Badge>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="font-mono text-[11px] text-[#06b6d4]">{rule.mitre_tactic}</div>
                    <div className="font-mono text-[10px] text-slate-600 mt-0.5">{rule.mitre_technique}</div>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="text-[11px] text-slate-400">{rule.threshold} events / {rule.time_window_minutes}min</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(rule)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#f0384a]/50 hover:text-[#f0384a]"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm('Delete this rule? This action cannot be undone.')) {
                            onDelete(rule.id)
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-0">
                  <EmptyState 
                    icon={Shield} 
                    title="No detection rules found" 
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 border-t border-[#1f2229] flex items-center justify-between">
        <div className="text-[11px] text-slate-600">
          Showing {rules?.length || 0} of {total} rules
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}
