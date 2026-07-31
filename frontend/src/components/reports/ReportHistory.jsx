import React from 'react';
import { Download, Trash2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';

const TYPE_STYLES = {
  daily: 'bg-[#06b6d4]/12 text-[#06b6d4] border-[#06b6d4]/20',
  weekly: 'bg-purple-500/12 text-purple-400 border-purple-500/20',
  monthly: 'bg-[#2fbf71]/12 text-[#2fbf71] border-[#2fbf71]/20',
  custom: 'bg-[#f5942e]/12 text-[#f5942e] border-[#f5942e]/20',
};

const formatSize = (bytes) => {
  if (!bytes) return 'N/A';
  if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return Math.round(bytes / 1024) + ' KB';
};

export default function ReportHistory({ reports, isLoading, onDownload, onDelete }) {
  if (isLoading) {
    return (
      <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1f2229]">
          <h3 className="text-sm font-semibold text-slate-100">Generated Reports</h3>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-[#1f2229] animate-pulse">
            <div className="h-3 bg-[#1f2229] rounded w-48" />
            <div className="h-3 bg-[#1f2229] rounded w-16 ml-auto" />
            <div className="h-6 bg-[#1f2229] rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1f2229] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Generated Reports</h3>
        <span className="text-[11px] text-slate-600">{reports?.length || 0} total</span>
      </div>
      {!reports || reports.length === 0 ? (
        <EmptyState icon={FileText} title="No reports generated yet" description="Generate your first report above" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-[#0e1015] border-b border-[#1f2229]">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left">Report</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left w-20">Type</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left w-32 hidden md:table-cell">Period</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-center w-16 hidden lg:table-cell">Alerts</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left w-20 hidden lg:table-cell">Size</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-left w-24">Date</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-right w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(reports || []).map(report => {
                const type = report.report_type || report.reportType;
                const typeStyle = TYPE_STYLES[type] || TYPE_STYLES.custom;
                const generatedAt = report.generated_at || report.createdAt || report.created_at;
                const isGenerating = report.status === 'generating';
                return (
                  <tr key={report.id} className="border-b border-[#1f2229] hover:bg-[#191c24] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-slate-200">{report.title}</div>
                      <div className="font-mono text-[10px] text-slate-700 mt-0.5">{report.report_id || report.id}</div>
                    </td>
                    <td className="px-5 py-3.5 w-20">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${typeStyle}`}>{type}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[11px] text-slate-500 hidden md:table-cell">
                      {report.period_start ? `${report.period_start} – ${report.period_end}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-[11px] text-slate-400 text-center hidden lg:table-cell">
                      {report.total_alerts ?? report.totalAlerts ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-[11px] text-slate-500 hidden lg:table-cell">
                      {formatSize(report.file_size)}
                    </td>
                    <td className="px-5 py-3.5 text-[11px] text-slate-600">
                      {generatedAt ? formatDistanceToNow(new Date(generatedAt), { addSuffix: true }) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {isGenerating ? (
                        <div className="flex justify-end"><Spinner size="sm" /></div>
                      ) : (
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => onDownload(report.id)}>
                            <Download className="w-3.5 h-3.5 text-[#06b6d4]" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => onDelete(report.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-[#f0384a]/50 hover:text-[#f0384a]" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
