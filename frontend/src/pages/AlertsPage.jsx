import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useAlerts, useUpdateAlertStatus, useBulkUpdateAlertStatus, useAlertStats } from '../hooks/useAlerts'
import AlertsTable from '../components/alerts/AlertsTable'
import AlertFilters from '../components/alerts/AlertFilters'
import AlertDetailModal from '../components/alerts/AlertDetailModal'
import StatPill from '../components/ui/StatPill'
import Button from '../components/ui/Button'
import { ChevronDown } from 'lucide-react'

export default function AlertsPage() {
  const [filters, setFilters] = useState({})
  const [pagination, setPagination] = useState({ page: 1, limit: 20 })
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDropdownOpen, setBulkDropdownOpen] = useState(false)
  const bulkDropdownRef = useRef(null)

  const { data, isLoading } = useAlerts(filters, pagination)
  const { data: stats, isLoading: statsLoading } = useAlertStats()
  const updateStatus = useUpdateAlertStatus()
  const bulkUpdateStatus = useBulkUpdateAlertStatus()

  const alerts = data?.alerts || (Array.isArray(data) ? data : (data?.data ?? []))
  const paginationMeta = {
    page: pagination.page,
    limit: pagination.limit,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (bulkDropdownRef.current && !bulkDropdownRef.current.contains(e.target)) {
        setBulkDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAlertClick = useCallback((alert) => {
    setSelectedAlert(alert)
    setIsModalOpen(true)
  }, [])

  const handleStatusChange = useCallback((alertId, status) => {
    updateStatus.mutate({ id: alertId, status })
  }, [updateStatus])

  const handleBulkStatusChange = useCallback((status) => {
    if (selectedIds.length === 0) return
    bulkUpdateStatus.mutate({ alertIds: selectedIds, status }, {
      onSuccess: () => setSelectedIds([])
    })
    setBulkDropdownOpen(false)
  }, [bulkUpdateStatus, selectedIds])

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const handleSelectAlert = useCallback((id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.length === alerts.length
        ? []
        : alerts.map(a => a.id)
    )
  }, [alerts])

  return (
    <div className="space-y-4">

      {/* SLIM STATUS BAR */}
      <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatPill label="Total" value={statsLoading ? '—' : (stats?.total ?? '—')} color="slate" />
          <div className="w-px h-4 bg-[#1f2229]" />
          <StatPill label="Open" value={statsLoading ? '—' : (stats?.byStatus?.open ?? '—')} color="critical" />
          <div className="w-px h-4 bg-[#1f2229]" />
          <StatPill label="Investigating" value={statsLoading ? '—' : (stats?.byStatus?.investigating ?? '—')} color="high" />
          <div className="w-px h-4 bg-[#1f2229]" />
          <StatPill label="Resolved" value={statsLoading ? '—' : (stats?.byStatus?.resolved ?? '—')} color="success" />
        </div>

        {selectedIds.length > 0 && (
          <div className="relative" ref={bulkDropdownRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkDropdownOpen(prev => !prev)}
            >
              Bulk Actions ({selectedIds.length})
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
            {bulkDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-20 bg-[#13151b] border border-[#1f2229] rounded-xl overflow-hidden shadow-xl min-w-[180px]">
                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#191c24] transition-colors"
                  onClick={() => handleBulkStatusChange('investigating')}
                >
                  Mark Investigating
                </button>
                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#191c24] transition-colors"
                  onClick={() => handleBulkStatusChange('resolved')}
                >
                  Mark Resolved
                </button>
                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#191c24] transition-colors"
                  onClick={() => handleBulkStatusChange('false_positive')}
                >
                  Mark False Positive
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FILTERS */}
      <AlertFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={() => setFilters({})}
        totalCount={data?.total ?? 0}
        filteredCount={alerts.length}
      />

      {/* ALERTS TABLE */}
      <AlertsTable
        alerts={alerts}
        isLoading={isLoading}
        onAlertClick={handleAlertClick}
        onStatusChange={handleStatusChange}
        onBulkStatusChange={handleBulkStatusChange}
        pagination={paginationMeta}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        selectedIds={selectedIds}
        onSelectAlert={handleSelectAlert}
        onSelectAll={handleSelectAll}
      />

      {/* DETAIL MODAL */}
      <AlertDetailModal
        alert={selectedAlert}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAlert(null)
        }}
      />

    </div>
  )
}
