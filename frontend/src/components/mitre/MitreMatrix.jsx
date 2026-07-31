import React from 'react';
import MitreTacticColumn from './MitreTacticColumn';
import MitreLegend from './MitreLegend';
import { Loader2 } from 'lucide-react';

export default function MitreMatrix({ data, isLoading, onTechniqueSelect, selectedTechniqueId }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-500 animate-spin mb-4" />
        <div className="text-gray-500 dark:text-slate-400 text-sm">Loading MITRE ATT&CK Matrix...</div>
      </div>
    );
  }

  if (!data || !data.framework) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 dark:text-slate-500">
        No MITRE ATT&CK data available.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto relative">
      {/* MATRIX HEADER ROW */}
      <div className="sticky left-0 top-0 z-10 bg-gray-50 dark:bg-slate-950 pb-4 pt-1 mb-4 border-b border-gray-200 dark:border-slate-800">
        <MitreLegend coveragePercentage={data.totalCoverage || 0} />
      </div>

      {/* MATRIX GRID */}
      <div className="flex gap-2 min-w-max pb-4">
        {(data.framework ?? []).map(tactic => (
          <MitreTacticColumn 
            key={tactic.id} 
            tactic={tactic}
            onTechniqueClick={onTechniqueSelect}
            selectedTechniqueId={selectedTechniqueId}
          />
        ))}
      </div>
    </div>
  );
}
