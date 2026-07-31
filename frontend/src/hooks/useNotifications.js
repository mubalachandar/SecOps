import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../services/api';
import toast from 'react-hot-toast';

export function useNotificationConfig() {
  return useQuery({
    queryKey: ['notifications', 'config'],
    queryFn: notificationsApi.getConfig,
    staleTime: 60000,
  });
}

export function useNotificationLogs(pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['notifications', 'logs', pagination],
    queryFn: () => notificationsApi.getLogs(pagination),
    staleTime: 30000,
  });
}

export function useNotificationStats() {
  return useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: notificationsApi.getStats,
    refetchInterval: 60000,
  });
}

export function useUpdateSlackConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationsApi.updateSlackConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'config'] });
      toast.success('Slack configuration saved');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to save Slack configuration');
    }
  });
}

export function useUpdateEmailConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationsApi.updateEmailConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'config'] });
      toast.success('Email configuration saved');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to save Email configuration');
    }
  });
}

export function useTestSlack() {
  return useMutation({
    mutationFn: notificationsApi.testSlack,
    onSuccess: () => {
      toast.success('Test Slack notification sent — check your channel');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to send test notification');
    }
  });
}

export function useTestEmail() {
  return useMutation({
    mutationFn: notificationsApi.testEmail,
    onSuccess: () => {
      toast.success('Test email sent — check your inbox');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to send test email');
    }
  });
}
