import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { BarChart2 } from 'lucide-react';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';

const COLOR_MAP = { 
  critical: '#f0384a', 
  high: '#f5942e', 
  medium: '#f0c419', 
  low: '#06b6d4', 
  info: '#8a93a6' 
};

export default function SeverityChart({ data, isLoading }) {
  const safeData = Array.isArray(data) ? data : [];
  const totalCount = safeData.reduce((acc, curr) => acc + (curr.count || 0), 0);

  if (isLoading) {
    return (
      <Card title="Severity Distribution" padding="md">
        <div className="w-full h-[280px] flex flex-col items-center justify-center gap-6">
          <div className="w-48 h-48 rounded-full bg-[var(--bg-surface-2)] animate-pulse shrink-0"></div>
          <div className="flex gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-2 w-12 bg-[var(--bg-surface-2)] rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (totalCount === 0 || safeData.length === 0) {
    return (
      <Card title="Severity Distribution" padding="md">
        <div className="w-full h-[280px] flex items-center justify-center">
          <EmptyState icon={BarChart2} title="No Severity Data" />
        </div>
      </Card>
    );
  }

  const CustomLabel = ({ viewBox }) => {
    const { cx, cy } = viewBox;
    return (
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
        <tspan x={cx} y={cy - 4} className="fill-[var(--text-primary)] text-2xl font-bold font-mono">
          {totalCount.toLocaleString()}
        </tspan>
        <tspan x={cx} y={cy + 16} className="fill-slate-500 text-xs">
          Alerts
        </tspan>
      </text>
    );
  };

  return (
    <Card title="Severity Distribution" padding="md">
      <div className="w-full h-[280px] flex flex-col items-center justify-center">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={safeData}
              dataKey="count"
              nameKey="severity"
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={96}
              paddingAngle={2}
              stroke="none"
            >
              {safeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLOR_MAP[entry.severity.toLowerCase()] || COLOR_MAP.info} />
              ))}
              <Label content={<CustomLabel />} />
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#13151b', 
                border: '1px solid #2a2e38', 
                borderRadius: '12px', 
                color: '#e2e8f0', 
                fontSize: '12px', 
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)' 
              }}
              itemStyle={{ color: '#e2e8f0' }}
              formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-1 w-full">
          {safeData.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-400">
              <div 
                className="w-2 h-2 rounded-sm shrink-0" 
                style={{ backgroundColor: COLOR_MAP[entry.severity.toLowerCase()] || COLOR_MAP.info }}
              />
              <span className="capitalize">{entry.severity}</span>
              <span className="font-semibold text-slate-200 font-mono tabular-nums">
                {entry.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
