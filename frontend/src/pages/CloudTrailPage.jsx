import React, { useState, useCallback } from 'react'
import ErrorBoundary from '../components/ErrorBoundary'
import { 
  useCloudTrailEvents, useCloudTrailStats,
  useEngineStats, useSimulateAttack 
} from '../hooks/useCloudTrail'
import EventsTable from '../components/cloudtrail/EventsTable'
import EventDetailModal from '../components/cloudtrail/EventDetailModal'
import SimulateAttackPanel from '../components/cloudtrail/SimulateAttackPanel'
import EngineStatsBar from '../components/cloudtrail/EngineStatsBar'
import SectionHeader from '../components/ui/SectionHeader'
import { Zap } from 'lucide-react'

export default function CloudTrailPage() {
  const [filters, setFilters] = useState({})
  const [pagination, setPagination] = useState({ page: 1, limit: 20 })
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showSimulator, setShowSimulator] = useState(false)

  const { data, isLoading } = useCloudTrailEvents(filters, pagination)
  const { data: stats } = useCloudTrailStats()
  const { data: engineStats, isLoading: engineLoading } = useEngineStats()
  const simulateAttack = useSimulateAttack()

  const events = data?.events || (Array.isArray(data) ? data : (data?.data ?? []))
  const paginationMeta = {
    page: pagination.page,
    limit: pagination.limit,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1
  }

  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }, [])

  const handleSimulate = useCallback(async (scenarioId) => {
    try {
      await new Promise((resolve, reject) => {
        simulateAttack.mutate(scenarioId, { onSuccess: resolve, onError: reject })
      })
    } catch (err) {
      // handled by mutation onError
    }
  }, [simulateAttack])

  return (
    <div className="space-y-4">
      <SectionHeader 
        title="CloudTrail Events" 
        subtitle="AWS API activity and detection engine status"
      />

      <EngineStatsBar
        stats={engineStats ?? {}}
        isLoading={engineLoading}
      />

      <div className="flex justify-end">
        <button
          onClick={() => setShowSimulator(prev => !prev)}
          className="flex items-center gap-2 px-4 py-2 bg-[#13151b] hover:bg-[#191c24] border border-[#1f2229] hover:border-[#2a2e38] text-[#f5942e] text-[11px] font-medium rounded-lg transition-all"
        >
          <Zap className="w-3.5 h-3.5" />
          {showSimulator ? 'Hide Simulator' : 'Simulate Attack'}
        </button>
      </div>

      {showSimulator && (
        <ErrorBoundary>
          <SimulateAttackPanel
            onSimulate={handleSimulate}
            isLoading={simulateAttack.isPending}
          />
        </ErrorBoundary>
      )}

      <EventsTable
        events={events}
        isLoading={isLoading}
        onEventClick={handleEventClick}
        pagination={paginationMeta}
        onPageChange={(page) =>
          setPagination(prev => ({ ...prev, page }))
        }
      />

      <EventDetailModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedEvent(null)
        }}
      />
    </div>
  )
}
