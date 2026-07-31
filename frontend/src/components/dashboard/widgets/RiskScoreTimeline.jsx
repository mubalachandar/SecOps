import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../../services/api';
import Card from '../../ui/Card';
import EmptyState from '../../ui/EmptyState';
import { Loader2, Brain } from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function useRiskScoreTimeline() {
  return useQuery({
    queryKey: ['analytics', 'risk-timeline'],
    queryFn: () => analyticsApi.getRiskScoreTimeline(),
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

export default function RiskScoreTimeline() {
  const { data, isLoading } = useRiskScoreTimeline();

  return (
    <Card title="AI Risk Score Timeline" subtitle="14-day average risk from Gemini analysis" padding="md" className="h-full flex flex-col">
      <div className="flex-grow flex flex-col justify-center min-h-[280px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-[#64748b]" />
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState icon={<Brain className="w-8 h-8" />} title="Awaiting AI Analysis" />
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }} 
                    tickFormatter={(val) => format(new Date(val), 'MMM dd')} 
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    ticks={[0, 25, 50, 75, 100]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }} 
                  />
                  <ReferenceLine 
                    y={75} 
                    stroke="#f0384a" 
                    strokeDasharray="4 4" 
                    strokeOpacity={0.5} 
                    label={{ value: 'CRITICAL THRESHOLD', fill: '#f0384a', fontSize: 10, position: 'insideTopRight', fontWeight: 'bold' }} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="avgRisk" 
                    name="Avg Daily Risk" 
                    stroke="#06b6d4" 
                    strokeWidth={3} 
                    dot={false} 
                    activeDot={{ r: 6, fill: '#06b6d4' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="maxRisk" 
                    name="Peak Risk" 
                    stroke="#f0384a" 
                    strokeWidth={2} 
                    strokeDasharray="4 4" 
                    dot={false} 
                    activeDot={{ r: 4, fill: '#f0384a' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="border-t border-[#2a2e38] pt-4 mt-4 flex items-center justify-center gap-6 text-xs text-[#64748b]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-[#06b6d4]"></div>
                <span>Avg Daily Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-[2px] border-t-2 border-dashed border-[#f0384a]"></div>
                <span>Peak Risk</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
