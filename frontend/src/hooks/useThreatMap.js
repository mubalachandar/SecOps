import { useQuery } from '@tanstack/react-query';
import { geoipApi } from '../services/api';

export function useThreatOrigins(params) {
  return useQuery({
    queryKey: ['geoip', 'origins', params],
    queryFn: () => geoipApi.getThreatOrigins(params),
    staleTime: 60000,
    refetchInterval: 120000
  });
}

export function useCountryStats(params) {
  return useQuery({
    queryKey: ['geoip', 'countries', params],
    queryFn: () => geoipApi.getCountryStats(params),
    staleTime: 120000
  });
}

export function useHeatmapData(params) {
  return useQuery({
    queryKey: ['geoip', 'heatmap', params],
    queryFn: () => geoipApi.getHeatmapData(params),
    staleTime: 120000
  });
}

export function useLiveThreats() {
  return useQuery({
    queryKey: ['geoip', 'live'],
    queryFn: () => geoipApi.getLiveThreats(),
    refetchInterval: 30000,
    staleTime: 15000
  });
}
