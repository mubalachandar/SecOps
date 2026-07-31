import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rulesApi } from '../services/api'
import toast from 'react-hot-toast'

export function useRules(filters = {}, pagination = {}) {
  return useQuery({
    queryKey: ['rules', filters, pagination],
    queryFn: () => rulesApi.getRules({ ...filters, ...pagination }),
    staleTime: 30000,
    keepPreviousData: true,
  })
}

export function useRuleById(id) {
  return useQuery({
    queryKey: ['rules', id],
    queryFn: () => rulesApi.getRuleById(id),
    enabled: !!id,
    staleTime: 60000,
  })
}

export function useRuleStats() {
  return useQuery({
    queryKey: ['rules', 'stats'],
    queryFn: rulesApi.getStats,
    staleTime: 60000,
    refetchInterval: 60000,
  })
}

export function useCreateRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => rulesApi.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      toast.success('Detection rule created successfully')
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.error?.message ||
        'Failed to create rule'
      )
    }
  })
}

export function useUpdateRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => rulesApi.updateRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      toast.success('Rule updated successfully')
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.error?.message ||
        'Failed to update rule'
      )
    }
  })
}

export function useDeleteRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => rulesApi.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      toast.success('Rule deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete rule')
    }
  })
}

export function useToggleRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }) =>
      rulesApi.toggleRule(id, isActive),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      toast.success(
        `Rule ${variables.isActive ? 'enabled' : 'disabled'}`
      )
    },
    onError: () => {
      toast.error('Failed to toggle rule')
    }
  })
}
