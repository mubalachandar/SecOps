import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsApi } from '../services/api'
import toast from 'react-hot-toast'

export function useAlerts(filters = {}, pagination = {}) {
  return useQuery({
    queryKey: ['alerts', filters, pagination],
    queryFn: () => alertsApi.getAlerts({ ...filters, ...pagination }),
    staleTime: 15000,
    keepPreviousData: true,
  })
}

export function useAlertById(id) {
  return useQuery({
    queryKey: ['alerts', id],
    queryFn: () => alertsApi.getAlertById(id),
    enabled: !!id,
    staleTime: 30000,
  })
}

export function useAlertAnalysis(id) {
  return useQuery({
    queryKey: ['alerts', id, 'analysis'],
    queryFn: () => alertsApi.getAnalysis(id),
    enabled: !!id,
    staleTime: 300000,
    retry: 1,
  })
}

export function useAlertStats() {
  return useQuery({
    queryKey: ['alerts', 'stats'],
    queryFn: alertsApi.getStats,
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

export function useUpdateAlertStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => alertsApi.updateStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      toast.success(`Alert status updated to ${variables.status}`)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to update status')
    }
  })
}

export function useTriggerAnalysis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => alertsApi.triggerAnalysis(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['alerts', id, 'analysis'] })
      toast.success('AI analysis triggered successfully')
    },
    onError: () => {
      toast.error('Failed to trigger AI analysis')
    }
  })
}

export function useBulkUpdateAlertStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ alertIds, status }) => alertsApi.bulkUpdateStatus(alertIds, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      toast.success(`${variables.alertIds.length} alerts marked as ${variables.status.replace('_', ' ')}`)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to update alerts')
    }
  })
}
