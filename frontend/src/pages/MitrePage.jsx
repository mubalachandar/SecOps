import React, { useState } from 'react';
import { Target, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { useMitreMatrix, useMitreCoverage } from '../hooks/useMitre';
import MitreMatrix from '../components/mitre/MitreMatrix';
import MitreDetailPanel from '../components/mitre/MitreDetailPanel';
import MitreLegend from '../components/mitre/MitreLegend';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';

export default function MitrePage() {
  const { data: matrixData, isLoading: isMatrixLoading } = useMitreMatrix();
  const { data: coverageData, isLoading: isCoverageLoading } = useMitreCoverage();

  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleTechniqueClick = (technique, tacticId) => {
    setSelectedTechnique({ ...technique, tacticId });
    setSelectedType('technique');
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => {
      setSelectedTechnique(null);
      setSelectedType(null);
    }, 300);
  };

  let activeThreatsCount = 0;
  if (matrixData?.framework) {
    matrixData.framework.forEach(tactic => {
      tactic.techniques.forEach(tech => {
        if (tech.isActive) {
          activeThreatsCount++;
        }
      });
    });
  }

  const covTotal = coverageData?.totalTechniques || 0;
  const covCovered = coverageData?.coveredTechniques || 0;
  const covPercent = coverageData?.coveragePercentage || 0;

  return (
    <div className="max-w-full space-y-4">
      <SectionHeader title="MITRE ATT&CK Matrix" subtitle="Real-time threat coverage visualization" level="page" />
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 mb-1">Total Techniques</div>
            <div className="text-3xl font-bold text-slate-100">{isCoverageLoading ? '—' : covTotal}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#191c24] border border-[#1f2229] flex items-center justify-center">
            <Target className="w-5 h-5 text-slate-500" />
          </div>
        </div>
        <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 mb-1">Covered</div>
            <div className="text-3xl font-bold text-slate-100">{isCoverageLoading ? '—' : covCovered}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#191c24] border border-[#1f2229] flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-[#2fbf71]" />
          </div>
        </div>
        <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 mb-1">Coverage %</div>
            <div className="text-3xl font-bold text-slate-100">{isCoverageLoading ? '—' : `${covPercent}%`}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#191c24] border border-[#1f2229] flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#06b6d4]" />
          </div>
        </div>
        <div className="bg-[#13151b] border border-[#1f2229] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 mb-1">Active Threats</div>
            <div className="text-3xl font-bold text-slate-100">{isMatrixLoading ? '—' : activeThreatsCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#191c24] border border-[#1f2229] flex items-center justify-center">
            <AlertTriangle className={`w-5 h-5 text-[#f0384a] ${activeThreatsCount > 0 ? 'animate-pulse' : ''}`} />
          </div>
        </div>
      </div>
      
      <MitreLegend coveragePercentage={covPercent} />
      
      <Card padding="none" title="Enterprise Matrix" subtitle="Click any technique to view details">
        <div className="p-4 overflow-x-auto">
          <MitreMatrix
            data={matrixData}
            isLoading={isMatrixLoading}
            onTechniqueSelect={handleTechniqueClick}
            selectedTechniqueId={selectedTechnique?.id}
          />
        </div>
      </Card>
      
      <MitreDetailPanel
        selectedItem={selectedTechnique}
        type={selectedType}
        isOpen={isPanelOpen}
        onClose={closePanel}
      />
    </div>
  );
}
