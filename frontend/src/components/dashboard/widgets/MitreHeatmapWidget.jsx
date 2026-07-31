import React from 'react';
import { useAttackVectors } from '../../../hooks/useAnalytics';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Grid3X3 } from 'lucide-react';
import Card from '../../ui/Card';
import EmptyState from '../../ui/EmptyState';

const TACTICS = [
  { id: 'TA0001', name: 'Initial Access' },
  { id: 'TA0002', name: 'Execution' },
  { id: 'TA0003', name: 'Persistence' },
  { id: 'TA0004', name: 'Privilege Escalation' },
  { id: 'TA0005', name: 'Defense Evasion' },
  { id: 'TA0006', name: 'Credential Access' }
];

export default function MitreHeatmapWidget() {
  const { data: attackVectors, isLoading } = useAttackVectors();
  const navigate = useNavigate();

  const getTacticCount = (tacticName) => {
    if (!attackVectors || !Array.isArray(attackVectors)) return 0;
    const vector = attackVectors.find(a => a.tactic === tacticName);
    return vector ? vector.count : 0;
  };

  const getIntensityClasses = (count) => {
    if (count === 0) return 'bg-[var(--bg-surface-2)] text-[var(--text-muted)] border-[var(--border-color)]';
    if (count <= 2) return 'bg-[#06b6d4]/10 text-[#06b6d4] border-[#06b6d4]/20 shadow-[inset_0_0_10px_rgba(6,182,212,0.05)]';
    if (count <= 5) return 'bg-[#f0c419]/10 text-[#f0c419] border-[#f0c419]/20 shadow-[inset_0_0_10px_rgba(240,196,25,0.05)]';
    if (count <= 10) return 'bg-[#f5942e]/10 text-[#f5942e] border-[#f5942e]/20 shadow-[inset_0_0_10px_rgba(245,148,46,0.05)]';
    return 'bg-[#f0384a]/10 text-[#f0384a] border-[#f0384a]/30 shadow-[inset_0_0_10px_rgba(240,56,74,0.05)]';
  };

  const hasData = TACTICS.some(t => getTacticCount(t.name) > 0);

  const headerAction = (
    <Link 
      to="/mitre" 
      className="text-xs text-[#06b6d4] hover:text-[#06b6d4]/80 font-medium transition-colors"
    >
      Full Matrix →
    </Link>
  );

  return (
    <Card 
      title="MITRE Coverage" 
      subtitle="Attack tactic distribution" 
      headerAction={headerAction}
      padding="md" 
      className="h-full flex flex-col"
    >
      <div className="flex-1 flex flex-col relative min-h-[220px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : !hasData ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <EmptyState icon={Grid3X3} title="No Coverage Data" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 h-full">
            {TACTICS.map((tactic) => {
              const count = getTacticCount(tactic.name);
              const intensityClass = getIntensityClasses(count);
              
              return (
                <div
                  key={tactic.id}
                  onClick={() => navigate('/mitre')}
                  className={`rounded-xl p-3.5 flex flex-col justify-between border cursor-pointer hover:border-accent hover:scale-[1.02] transition-all duration-200 ${intensityClass}`}
                >
                  <div className="text-[10px] font-mono font-medium opacity-60">
                    {tactic.id}
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums my-1">
                    {count}
                  </div>
                  <div className="text-[11px] font-semibold leading-tight truncate">
                    {tactic.name}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
