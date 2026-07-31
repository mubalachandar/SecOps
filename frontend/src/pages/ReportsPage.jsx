import React, { useState } from 'react';
import { useReports } from '../hooks/useReports';
import SectionHeader from '../components/ui/SectionHeader';
import ReportGenerator from '../components/reports/ReportGenerator';
import ReportHistory from '../components/reports/ReportHistory';
import ReportPreview from '../components/reports/ReportPreview';
import Card from '../components/ui/Card';
import { useDownloadReport, useDeleteReport } from '../hooks/useReports';

export default function ReportsPage() {
  const { data, isLoading } = useReports();
  const downloadReport = useDownloadReport();
  const deleteReport = useDeleteReport();

  const reports = data?.data || data || [];
  const totalAlerts = reports.reduce((sum, r) => sum + (r.total_alerts || r.totalAlerts || 0), 0);
  const mostCommonType = reports.length > 0 
    ? Object.entries(reports.reduce((acc, r) => { acc[r.report_type || r.reportType] = (acc[r.report_type || r.reportType] || 0) + 1; return acc; }, {})).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A'
    : 'N/A';

  return (
    <div className="space-y-4">
      <SectionHeader title="Security Reports" subtitle="Generate and download comprehensive PDF security briefings" level="page" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ReportGenerator />
          <ReportHistory
            reports={reports}
            isLoading={isLoading}
            onDownload={(id) => downloadReport.mutate(id)}
            onDelete={(id) => deleteReport.mutate(id)}
          />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <ReportPreview />
          <Card title="Report Statistics">
            <div className="space-y-3">
              {[['Total Reports', reports.length], ['Total Alerts Reported', totalAlerts], ['Most Common Type', mostCommonType]].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-[#1f2229] last:border-0">
                  <span className="text-[11px] text-slate-500">{label}</span>
                  <span className="text-[11px] font-semibold text-slate-200 capitalize">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
