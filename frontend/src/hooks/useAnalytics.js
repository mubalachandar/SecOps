import { useQuery } from '@tanstack/react-query'
import { analyticsApi, alertsApi } from '../services/api'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: analyticsApi.getDashboardStats,
    refetchInterval: 60000, // refresh every 60 seconds
    staleTime: 30000,
  })
}

export function useAlertTrend(days = 7) {
  return useQuery({
    queryKey: ['analytics', 'trend', days],
    queryFn: () => analyticsApi.getAlertTrend(days),
    staleTime: 300000,
  })
}

export function useSeverityDistribution() {
  return useQuery({
    queryKey: ['analytics', 'severity'],
    queryFn: analyticsApi.getSeverityDistribution,
    staleTime: 120000,
  })
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['analytics', 'health'],
    queryFn: analyticsApi.getSystemHealth,
    refetchInterval: 30000, // check health every 30s
    staleTime: 15000,
  })
}

export function useRecentAlerts() {
  return useQuery({
    queryKey: ['alerts', 'recent'],
    queryFn: () => alertsApi.getAlerts({
      limit: 5,
      sortBy: 'created_at',
      sortOrder: 'desc'
    }),
    refetchInterval: 30000,
    staleTime: 15000,
  })
}

export function useAttackVectors() {
  return useQuery({
    queryKey: ['analytics', 'attack-vectors'],
    queryFn: analyticsApi.getTopAttackVectors,
    staleTime: 300000,
  })
}

export function useTopSourceIPs(limit = 10) {
  return useQuery({
    queryKey: ['analytics', 'top-ips', limit],
    queryFn: () => analyticsApi.getTopSourceIPs(limit),
    refetchInterval: 120000,
  })
}

export function useMTTR(days = 30) {
  return useQuery({
    queryKey: ['analytics', 'mttr', days],
    queryFn: () => analyticsApi.getMTTR(days),
    staleTime: 300000,
  })
}

export function useGeographicDistribution() {
  return useQuery({
    queryKey: ['analytics', 'geographic'],
    queryFn: analyticsApi.getGeographicDistribution,
    staleTime: 300000,
  })
}

export function useRealtimeAlerts() {
  return useQuery({
    queryKey: ['alerts', 'realtime'],
    queryFn: () => alertsApi.getAlerts({ limit: 50, sortBy: 'created_at', sortOrder: 'desc' }),
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  })
}

export function useAlertCount() {
  return useQuery({
    queryKey: ['alerts', 'count'],
    queryFn: async () => {
      const data = await alertsApi.getAlerts({ status: 'open', limit: 1 });
      return data.total || 0;
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  })
}
