import { useQuery } from '@tanstack/react-query';
import { mitreApi } from '../services/api';

export function useMitreMatrix() {
  return useQuery({
    queryKey: ['mitre', 'matrix'],
    queryFn: mitreApi.getMatrix,
    staleTime: 60000,
    refetchInterval: 120000,
  });
}

export function useMitreCoverage() {
  return useQuery({
    queryKey: ['mitre', 'coverage'],
    queryFn: mitreApi.getCoverage,
    staleTime: 60000,
  });
}

export function useMitreTacticDetail(tacticId) {
  return useQuery({
    queryKey: ['mitre', 'tactic', tacticId],
    queryFn: () => mitreApi.getTacticDetail(tacticId),
    enabled: !!tacticId,
  });
}

export function useMitreTechniqueDetail(techniqueId) {
  return useQuery({
    queryKey: ['mitre', 'technique', techniqueId],
    queryFn: () => mitreApi.getTechniqueDetail(techniqueId),
    enabled: !!techniqueId,
  });
}
