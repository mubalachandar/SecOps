import React, { useState, useCallback } from 'react'
import {
  useRules, useRuleStats, useCreateRule,
  useUpdateRule, useDeleteRule, useToggleRule
} from '../hooks/useRules'
import RulesTable from '../components/rules/RulesTable'
import RuleFormModal from '../components/rules/RuleFormModal'
import RuleDetailModal from '../components/rules/RuleDetailModal'
import Button from '../components/ui/Button'
import SectionHeader from '../components/ui/SectionHeader'
import StatPill from '../components/ui/StatPill'
import { Plus } from 'lucide-react'

export default function RulesPage() {
  const [pagination, setPagination] = useState({ page: 1, limit: 20 })
  const [selectedRule, setSelectedRule] = useState(null)
  const [editingRule, setEditingRule] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const { data, isLoading } = useRules({}, pagination)
  const { data: stats, isLoading: statsLoading } = useRuleStats()
  const createRule = useCreateRule()
  const updateRule = useUpdateRule()
  const deleteRule = useDeleteRule()
  const toggleRule = useToggleRule()

  const rules = data?.rules || (Array.isArray(data) ? data : (data?.data ?? []))
  const paginationMeta = {
    page: pagination.page,
    limit: pagination.limit,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1
  }

  const handleRuleClick = useCallback((rule) => {
    setSelectedRule(rule)
    setIsDetailOpen(true)
  }, [])

  const handleEdit = useCallback((rule) => {
    setEditingRule(rule)
    setIsFormOpen(true)
    setIsDetailOpen(false)
  }, [])

  const handleCreateNew = useCallback(() => {
    setEditingRule(null)
    setIsFormOpen(true)
  }, [])

  const handleFormSubmit = useCallback((formData) => {
    if (editingRule) {
      updateRule.mutate(
        { id: editingRule.id, data: formData },
        { onSuccess: () => setIsFormOpen(false) }
      )
    } else {
      createRule.mutate(
        formData,
        { onSuccess: () => setIsFormOpen(false) }
      )
    }
  }, [editingRule, createRule, updateRule])

  const handleToggle = useCallback((ruleId, isActive) => {
    toggleRule.mutate({ id: ruleId, isActive })
  }, [toggleRule])

  const handleDelete = useCallback((ruleId) => {
    deleteRule.mutate(ruleId)
  }, [deleteRule])

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Detection Rules"
        subtitle="MITRE ATT&CK mapped threat detection engine"
        level="page"
      />
      
      {/* Status bar */}
      <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl px-5 py-3 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <StatPill label="Total" value={stats?.total ?? '—'} color="slate" />
          <StatPill label="Active" value={stats?.active ?? '—'} color="success" />
          <StatPill label="Critical" value={stats?.bySeverity?.critical ?? '—'} color="critical" />
          <StatPill label="High" value={stats?.bySeverity?.high ?? '—'} color="high" />
        </div>
        <Button variant="primary" size="sm" onClick={handleCreateNew}>
          <Plus className="w-3.5 h-3.5" />
          New Rule
        </Button>
      </div>

      {/* Top triggered pills */}
      {stats?.topTriggered?.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-600 self-center mr-1">Top Triggered:</span>
          {stats.topTriggered.map(r => (
            <span key={r.ruleId} className="inline-flex items-center gap-1.5 bg-[#13151b] border border-[#1f2229] rounded-full px-2.5 py-1 text-[11px]">
              <span className="text-slate-300">{r.ruleName}</span>
              <span className="font-mono text-[10px] text-[#06b6d4] bg-[#06b6d4]/10 px-1 py-0.5 rounded">{r.triggerCount}x</span>
            </span>
          ))}
        </div>
      )}

      <RulesTable
        rules={rules}
        isLoading={isLoading}
        onRuleClick={handleRuleClick}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
        pagination={paginationMeta}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
      />

      <RuleDetailModal
        rule={selectedRule}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedRule(null)
        }}
        onEdit={handleEdit}
      />

      <RuleFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingRule(null)
        }}
        rule={editingRule}
        onSubmit={handleFormSubmit}
        isLoading={createRule.isPending || updateRule.isPending}
      />
    </div>
  )
}
