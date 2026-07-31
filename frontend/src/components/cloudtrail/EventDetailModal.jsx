import React, { useState } from 'react'
import { X, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import Badge from '../ui/Badge'

function CollapsibleSection({ title, data }) {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const text = JSON.stringify(data, null, 2)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <div className="bg-[#13151b] border border-[#1f2229] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#191c24] transition-colors">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className="flex items-center gap-2">
          <button onClick={e => { e.stopPropagation(); copy() }} className="text-[10px] text-slate-600 hover:text-slate-400 flex items-center gap-1 transition-colors">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
        </div>
      </button>
      {open && (
        <pre className="bg-[#05060a] text-[11px] font-mono text-slate-300 p-4 overflow-x-auto leading-relaxed">{text}</pre>
      )}
    </div>
  )
}

export default function EventDetailModal({ event, isOpen, onClose }) {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen && event ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-[#0e1015] border-l border-[#1f2229] flex flex-col transition-transform duration-300 ease-out ${isOpen && event ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-14 shrink-0 border-b border-[#1f2229] px-5 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-sm text-[#06b6d4] font-semibold truncate">{event?.event_name}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{event?.event_source?.replace('.amazonaws.com','')}</div>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            {event?.alert_id && <Badge variant="critical" size="sm">Alert Generated</Badge>}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#191c24] text-slate-500 hover:text-slate-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {event && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="bg-[#13151b] border border-[#1f2229] rounded-xl p-4 grid grid-cols-2 gap-3">
              {[
                ['Event ID', event.event_id], 
                ['Region', event.aws_region], 
                ['Source IP', event.source_ip || '—'], 
                ['Time', event.event_time ? new Date(event.event_time).toLocaleString() : '—']
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">{label}</div>
                  <div className="font-mono text-[11px] text-slate-300 break-all">{value}</div>
                </div>
              ))}
            </div>
            
            {event.user_identity && (
              <CollapsibleSection title="User Identity" data={event.user_identity} />
            )}
            
            {event.request_parameters && Object.keys(event.request_parameters).length > 0 && (
              <CollapsibleSection title="Request Parameters" data={event.request_parameters} />
            )}
            
            {event.response_elements && Object.keys(event.response_elements).length > 0 && (
              <CollapsibleSection title="Response Elements" data={event.response_elements} />
            )}
            
            {event.error_code && (
              <div className="bg-[#f0384a]/8 border border-[#f0384a]/20 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-[#f0384a] mb-2">Error</div>
                <div className="font-mono text-[11px] text-[#f0384a]">{event.error_code}</div>
                {event.error_message && <div className="text-[11px] text-slate-400 mt-1">{event.error_message}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
