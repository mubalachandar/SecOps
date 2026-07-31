import React, { useState, useEffect } from 'react';
import { Clock, Calendar, BarChart2, Settings, FileText, Info } from 'lucide-react';
import { useGenerateReport } from '../../hooks/useReports';
import { format, subDays } from 'date-fns';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function ReportGenerator() {
  const [title, setTitle] = useState('Security Operations Report');
  const [reportType, setReportType] = useState('weekly');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const generateReport = useGenerateReport();

  useEffect(() => {
    const today = new Date();
    setPeriodEnd(format(today, 'yyyy-MM-dd'));
    if (reportType === 'daily') setPeriodStart(format(subDays(today, 1), 'yyyy-MM-dd'));
    else if (reportType === 'weekly') setPeriodStart(format(subDays(today, 7), 'yyyy-MM-dd'));
    else if (reportType === 'monthly') setPeriodStart(format(subDays(today, 30), 'yyyy-MM-dd'));
  }, [reportType]);

  const handleGenerate = () => {
    generateReport.mutate({ title, reportType, periodStart, periodEnd });
  };

  const typeOptions = [
    { id: 'daily', icon: Clock, title: 'Last 24 hours', desc: 'Quick daily briefing' },
    { id: 'weekly', icon: Calendar, title: 'Last 7 days', desc: 'Weekly security summary' },
    { id: 'monthly', icon: BarChart2, title: 'Last 30 days', desc: 'Monthly executive report' },
    { id: 'custom', icon: Settings, title: 'Custom range', desc: 'Define your own period' }
  ];

  return (
    <Card title="Generate Report">
      <div className="space-y-5">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">Report Title</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Weekly Security Summary Q3 2026" />
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-2">Report Type</label>
          <div className="grid grid-cols-2 gap-3">
            {typeOptions.map(opt => {
              const Icon = opt.icon;
              const isActive = reportType === opt.id;
              return (
                <div key={opt.id} onClick={() => setReportType(opt.id)}
                  className={`bg-[#0e1015] border rounded-xl p-4 cursor-pointer transition-all hover:border-[#2a2e38] ${
                    isActive ? 'border-[#06b6d4] bg-[#06b6d4]/5' : 'border-[#1f2229]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-[#191c24] flex items-center justify-center mb-3 ${
                    isActive ? 'bg-[#06b6d4]/10' : ''
                  }`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#06b6d4]' : 'text-slate-600'}`} />
                  </div>
                  <div className={`text-sm font-semibold ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>{opt.title}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{opt.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {reportType === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">Start Date</label>
              <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">End Date</label>
              <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
            </div>
          </div>
        )}

        <Button variant="primary" className="w-full" onClick={handleGenerate} isLoading={generateReport.isPending}>
          <FileText className="w-4 h-4" />
          {generateReport.isPending ? 'Generating...' : 'Generate PDF Report'}
        </Button>

        <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl p-3 flex gap-2 items-start">
          <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600">Reports are generated server-side and stored securely. Generation takes 10–30 seconds.</p>
        </div>
      </div>
    </Card>
  );
}
