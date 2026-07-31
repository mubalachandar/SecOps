import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../../services/api';
import Card from '../../ui/Card';
import EmptyState from '../../ui/EmptyState';
import { Loader2, Layers } from 'lucide-react';
import { format } from 'date-fns';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function useIncidentBurndown() {
  return useQuery({
    queryKey: ['analytics', 'incident-burndown'],
    queryFn: () => analyticsApi.getIncidentBurndown(),
    staleTime: 300000,
    refetchInterval: 300000,
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#13151b', border: '1px solid #2a2e38', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px', padding: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <p className="mb-2 font-mono">{label ? format(new Date(label), 'MMM dd, yyyy') : ''}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mt-1">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-mono font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function IncidentBurndown() {
  const { data, isLoading } = useIncidentBurndown();

  return (
    <Card title="Incident Burndown" subtitle="14-day new vs resolved incidents" padding="md" className="h-full flex flex-col">
      <div className="flex-grow flex flex-col justify-center min-h-[280px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-[#64748b]" />
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState icon={<Layers className="w-8 h-8" />} title="No Data Available" />
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }} 
                    tickFormatter={(val) => format(new Date(val), 'MMM dd')} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }} 
                  />
                  <ReferenceLine y={0} stroke="#2a2e38" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="created" 
                    name="New Incidents" 
                    fill="#f0384a" 
                    opacity={0.8} 
                    radius={[4, 4, 0, 0]} 
                    barSize={12} 
                  />
                  <Bar 
                    dataKey="resolved" 
                    name="Resolved" 
                    fill="#2fbf71" 
                    opacity={0.8} 
                    radius={[4, 4, 0, 0]} 
                    barSize={12} 
                  />
                  <Line 
                    type="stepAfter" 
                    dataKey="netNew" 
                    name="Net Trend" 
                    stroke="#f0c419" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: '#f0c419' }} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="border-t border-[#2a2e38] pt-4 mt-4 flex items-center justify-center gap-6 text-xs text-[#64748b]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#f0384a] rounded-sm opacity-80"></div>
                <span>New</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#2fbf71] rounded-sm opacity-80"></div>
                <span>Resolved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-[#f0c419]"></div>
                <span>Net Trend</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
