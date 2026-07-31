import React, { useMemo } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2, Target } from 'lucide-react';
import Card from '../../ui/Card';
import EmptyState from '../../ui/EmptyState';
import { useAttackVectors } from '../../../hooks/useAnalytics';

const TACTICS = [
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Lateral Movement',
  'Exfiltration'
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && Array.isArray(payload) && payload.length) {
    const total = payload.find(p => p.dataKey === 'value')?.payload.rawValue || 0;
    const critical = payload.find(p => p.dataKey === 'critical')?.payload.rawCritical || 0;
    
    return (
      <div className="bg-[var(--bg-surface-2)] border border-[var(--border-color)] px-3 py-2 rounded-lg shadow-xl text-xs">
        <p className="font-medium text-[var(--text-primary)] mb-1">{label}</p>
        <p className="text-[var(--text-secondary)]">Total Alerts: <span className="font-mono tabular-nums">{total}</span></p>
        {critical > 0 && (
          <p className="text-[#f0384a]">Critical: <span className="font-mono tabular-nums">{critical}</span></p>
        )}
      </div>
    );
  }
  return null;
};

export default function ThreatRadar() {
  const { data: attackVectors, isLoading } = useAttackVectors();

  const radarData = useMemo(() => {
    if (!attackVectors || !Array.isArray(attackVectors)) return [];
    
    const maxVal = Math.max(...TACTICS.map(t => {
      const v = attackVectors.find(a => a.tactic === t);
      return v ? v.count : 0;
    }), 1);
    
    return TACTICS.map(tactic => {
      const vector = attackVectors.find(a => a.tactic === tactic) || { count: 0, criticalCount: 0 };
      const normalizedValue = maxVal > 0 ? (vector.count / maxVal) * 100 : 0;
      const normalizedCritical = maxVal > 0 ? (vector.criticalCount / maxVal) * 100 : 0;
      
      return {
        subject: tactic,
        value: normalizedValue,
        critical: normalizedCritical,
        rawValue: vector.count,
        rawCritical: vector.criticalCount
      };
    });
  }, [attackVectors]);

  const hasCritical = radarData.some(d => d.rawCritical > 0);
  const isEmpty = radarData.every(d => d.rawValue === 0);

  return (
    <Card 
      title="Threat Radar" 
      subtitle="MITRE ATT&CK tactic coverage" 
      padding="none" 
      className="h-full flex flex-col"
    >
      <div className="flex-1 flex flex-col relative min-h-[280px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : isEmpty ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <EmptyState icon={Target} title="No Tactic Data" />
          </div>
        ) : (
          <div className="w-full h-full min-h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid gridType="polygon" stroke="#1f2229" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                
                {hasCritical && (
                  <Radar 
                    name="Critical" 
                    dataKey="critical" 
                    stroke="#f0384a" 
                    fill="#f0384a" 
                    fillOpacity={0.15} 
                    strokeWidth={2} 
                  />
                )}
                <Radar 
                  name="All Alerts" 
                  dataKey="value" 
                  stroke="#06b6d4" 
                  fill="#06b6d4" 
                  fillOpacity={0.25} 
                  strokeWidth={2} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}
