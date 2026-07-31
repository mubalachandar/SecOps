import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsApi } from '../services/api';
import toast from 'react-hot-toast';

export function useIncidents(filters = {}, pagination = {}) {
  return useQuery({
    queryKey: ['incidents', filters, pagination],
    queryFn: () => incidentsApi.getIncidents({ ...filters, ...pagination }),
    refetchInterval: 30000,
    keepPreviousData: true
  });
}

export function useIncidentById(id) {
  return useQuery({
    queryKey: ['incidents', id],
    queryFn: () => incidentsApi.getIncidentById(id),
    enabled: !!id
  });
}

export function useIncidentStats() {
  return useQuery({
    queryKey: ['incidents', 'stats'],
    queryFn: () => incidentsApi.getIncidentStats(),
    refetchInterval: 60000
  });
}

export function useResolveIncident() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => incidentsApi.resolveIncident(id),
    onSuccess: () => {
      toast.success('Incident resolved');
      queryClient.invalidateQueries(['incidents']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to resolve incident');
    }
  });
}

export function useTriggerCorrelation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => incidentsApi.triggerCorrelation(),
    onSuccess: (data) => {
      toast.success(`Correlation finished: ${data.incidentsCreated} created, ${data.alertsCorrelated} alerts correlated.`);
      queryClient.invalidateQueries(['incidents']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to trigger correlation');
    }
  });
}
