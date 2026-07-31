import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cloudtrailApi } from '../services/api'
import toast from 'react-hot-toast'

export function useCloudTrailEvents(filters = {}, pagination = {}) {
  return useQuery({
    queryKey: ['cloudtrail', 'events', filters, pagination],
    queryFn: () => cloudtrailApi.getEvents({ ...filters, ...pagination }),
    staleTime: 15000,
    keepPreviousData: true,
    refetchInterval: 30000,
  })
}

export function useCloudTrailStats() {
  return useQuery({
    queryKey: ['cloudtrail', 'stats'],
    queryFn: cloudtrailApi.getStats,
    staleTime: 60000,
    refetchInterval: 60000,
  })
}

export function useEngineStats() {
  return useQuery({
    queryKey: ['cloudtrail', 'engine'],
    queryFn: cloudtrailApi.getEngineStats,
    staleTime: 15000,
    refetchInterval: 15000,
  })
}

export function useSimulateAttack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (scenario) => cloudtrailApi.simulateAttack(scenario),
    onSuccess: async (data, scenario) => {
      try {
        await queryClient.invalidateQueries({ queryKey: ['cloudtrail'] })
        await queryClient.invalidateQueries({ queryKey: ['alerts'] })
        toast.success(
          `Attack scenario "${scenario || 'unknown'}" simulated — check Alerts`,
          { duration: 5000 }
        )
      } catch (err) {
        console.error('Invalidation error:', err)
      }
    },
    onError: (error) => {
      const msg = error?.response?.data?.error?.message || error?.response?.data?.error || error?.message || 'Failed to simulate attack scenario'
      toast.error(typeof msg === 'string' ? msg : 'Failed to simulate attack scenario')
    }
  })
}
