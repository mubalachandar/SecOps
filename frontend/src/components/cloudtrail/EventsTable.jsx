import React from 'react'
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import Card from '../ui/Card'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import Tooltip from '../ui/Tooltip'

export default function EventsTable({
  events,
  isLoading,
  onEventClick,
  pagination,
  onPageChange
}) {
  const { page, total, totalPages } = pagination

  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-[#0e1015] border-b border-[#1f2229]">
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left">Event Name</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left hidden md:table-cell">Source</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left">Time</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left hidden lg:table-cell">Region</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left hidden lg:table-cell">User</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left">Error</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left">Alert</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(10)].map((_, i) => (
                <tr key={i} className="border-b border-[#1f2229]">
                  <td className="px-5 py-3.5">
                    <div className="animate-pulse bg-[#1f2229] h-3 rounded w-3/4 mb-1"></div>
                    <div className="animate-pulse bg-[#1f2229] h-3 rounded w-1/2"></div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell"><div className="animate-pulse bg-[#1f2229] h-3 rounded w-16"></div></td>
                  <td className="px-5 py-3.5"><div className="animate-pulse bg-[#1f2229] h-3 rounded w-16"></div></td>
                  <td className="px-5 py-3.5 hidden lg:table-cell"><div className="animate-pulse bg-[#1f2229] h-3 rounded w-12"></div></td>
                  <td className="px-5 py-3.5 hidden lg:table-cell"><div className="animate-pulse bg-[#1f2229] h-3 rounded w-20"></div></td>
                  <td className="px-5 py-3.5"><div className="animate-pulse bg-[#1f2229] h-3 rounded w-8"></div></td>
                  <td className="px-5 py-3.5"><div className="animate-pulse bg-[#1f2229] h-3 rounded w-12"></div></td>
                </tr>
              ))
            ) : events && events.length > 0 ? (
              events.map(event => {
                const sourceStrip = (event.event_source || '').replace('.amazonaws.com', '')
                return (
                  <tr 
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="border-b border-[#1f2229] hover:bg-[#191c24] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] text-[#06b6d4] font-medium truncate max-w-[180px] block">{event.event_name}</span>
                      <span className="text-[10px] text-slate-700 font-mono truncate block">{event.event_id}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-[11px] text-slate-500">{sourceStrip || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Tooltip content={event.event_time}>
                        <span className="text-[11px] text-slate-600">
                          {(() => {
                            if (!event.event_time) return '—';
                            try {
                              return `${formatDistanceToNow(parseISO(event.event_time))} ago`;
                            } catch (e) {
                              return 'Invalid date';
                            }
                          })()}
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="font-mono text-[11px] text-slate-500">{event.aws_region || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-[11px] text-slate-500 truncate max-w-[100px] block" title={event.user_identity?.arn || ''}>
                        {event.user_identity?.userName || event.user_identity?.type || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {event.error_code ? (
                        <span className="font-mono text-[10px] text-[#f0384a] bg-[#f0384a]/8 px-1.5 py-0.5 rounded inline-block max-w-[100px] truncate" title={event.error_code}>
                          {event.error_code}
                        </span>
                      ) : (
                        <CheckCircle className="w-3 h-3 text-[#2fbf71]" />
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {event.alert_id ? (
                        <AlertTriangle className="w-3 h-3 text-[#f5942e]" />
                      ) : (
                        <span className="text-slate-700 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="7" className="p-0">
                  <EmptyState 
                    icon={Activity} 
                    title="No CloudTrail events found" 
                    description="Events will appear here as AWS activity is detected" 
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-4 border-t border-[#1f2229] flex items-center justify-between">
        <div className="text-[11px] text-slate-600">
          Showing {events?.length || 0} of {total} events
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
