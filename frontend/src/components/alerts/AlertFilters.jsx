import React, { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import Input from '../ui/Input'

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'false_positive', label: 'False +' },
]

export default function AlertFilters({ filters, onFiltersChange, onReset, totalCount, filteredCount }) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '')

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFiltersChange({ ...filters, search: searchTerm })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm, filters, onFiltersChange])

  const toggleFilter = (key, value) => {
    const newFilters = { ...filters }
    if (value === 'all') {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    onFiltersChange(newFilters)
  }

  const hasActiveFilters = !!(filters.severity || filters.status || filters.search)

  return (
    <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl p-3 flex items-center gap-3 flex-wrap">

      {/* SEARCH */}
      <Input
        icon={Search}
        placeholder="Search alerts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-1 min-w-48"
        size="sm"
      />

      {/* SEVERITY SEGMENTED CONTROL */}
      <div className="bg-[#191c24] rounded-lg p-0.5 flex gap-0.5 shrink-0">
        {SEVERITY_OPTIONS.map(opt => {
          const isActive = (!filters.severity && opt.value === 'all') || filters.severity === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => toggleFilter('severity', opt.value)}
              className={`text-[11px] font-medium px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                isActive
                  ? 'bg-[#2a2e38] text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* STATUS SEGMENTED CONTROL */}
      <div className="bg-[#191c24] rounded-lg p-0.5 flex gap-0.5 shrink-0">
        {STATUS_OPTIONS.map(opt => {
          const isActive = (!filters.status && opt.value === 'all') || filters.status === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => toggleFilter('status', opt.value)}
              className={`text-[11px] font-medium px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                isActive
                  ? 'bg-[#2a2e38] text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* RESULT COUNT + CLEAR */}
      <div className="ml-auto flex items-center gap-3 shrink-0">
        {hasActiveFilters && (
          <button
            onClick={() => { setSearchTerm(''); onReset() }}
            className="text-[11px] text-accent hover:text-accent/80 cursor-pointer transition-colors"
          >
            Clear filters
          </button>
        )}
        <span className="text-[11px] text-slate-600">
          Showing {filteredCount} of {totalCount}
        </span>
      </div>

    </div>
  )
}
