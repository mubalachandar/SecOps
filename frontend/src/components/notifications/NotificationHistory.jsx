import React from 'react';
import { useNotificationLogs } from '../../hooks/useNotifications';
import { CheckCircle, XCircle, Slack, Mail, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';

export default function NotificationHistory() {
  const { data, isLoading } = useNotificationLogs({ page: 1, limit: 50 });

  if (isLoading) {
    return (
      <Card title="Notification History" padding="none">
        <div className="p-5 border-b border-[#1f2229]">
          <h3 className="text-sm font-semibold text-slate-100">Delivery History</h3>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-[#1f2229] animate-pulse">
            <div className="h-4 bg-[#1f2229] rounded w-24" />
            <div className="h-4 bg-[#1f2229] rounded flex-1" />
            <div className="h-4 bg-[#1f2229] rounded w-20" />
          </div>
        ))}
      </Card>
    );
  }

  const logs = data?.data || [];

  return (
    <Card title="Notification History" padding="none">
      {logs.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications sent yet" description="History will appear here once alerts are triggered" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#0e1015] border-b border-[#1f2229]">
                <th className="px-5 py-3 text-[10px] font-semibold tracking-wider text-slate-600 uppercase w-24">Status</th>
                <th className="px-5 py-3 text-[10px] font-semibold tracking-wider text-slate-600 uppercase w-20">Channel</th>
                <th className="px-5 py-3 text-[10px] font-semibold tracking-wider text-slate-600 uppercase flex-1">Message</th>
                <th className="px-5 py-3 text-[10px] font-semibold tracking-wider text-slate-600 uppercase w-48 hidden md:table-cell">Target</th>
                <th className="px-5 py-3 text-[10px] font-semibold tracking-wider text-slate-600 uppercase w-28">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2229]">
              {(logs ?? []).map(log => (
                <tr key={log.id} className="hover:bg-[#191c24] transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {log.status === 'success' ? (
                      <div className="flex items-center gap-1.5 text-[#2fbf71] text-[11px] font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Delivered
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-[#f0384a] text-[11px] font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          Failed
                        </div>
                        {log.error_message && (
                          <span className="text-[10px] text-[#f0384a]/70 mt-0.5 max-w-[120px] truncate" title={log.error_message}>
                            {log.error_message}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border capitalize flex items-center justify-center w-fit gap-1 ${
                      log.channel === 'slack' ? 'bg-purple-500/15 text-purple-400 border-purple-500/20' : 'bg-[#06b6d4]/10 text-[#06b6d4] border-[#06b6d4]/20'
                    }`}>
                      {log.channel === 'slack' ? <span className="font-bold">#</span> : <Mail className="w-3 h-3" />}
                      {log.channel}
                    </span>
                  </td>
                  
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        log.event_type === 'incident' 
                          ? 'bg-[#f0384a]/15 text-[#f0384a] border border-[#f0384a]/20' 
                          : 'bg-[#f5942e]/15 text-[#f5942e] border border-[#f5942e]/20'
                      }`}>
                        {log.event_type.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-slate-300 truncate">
                        {log.target_id}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-5 py-3.5 whitespace-nowrap text-[11px] text-slate-400 truncate hidden md:table-cell" title={log.target_contact}>
                    {log.target_contact}
                  </td>
                  
                  <td className="px-5 py-3.5 whitespace-nowrap text-[11px] text-slate-500">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
