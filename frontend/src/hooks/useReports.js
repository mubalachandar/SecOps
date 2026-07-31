import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '../services/api';
import toast from 'react-hot-toast';

export function useReports(pagination) {
  return useQuery({
    queryKey: ['reports', pagination],
    queryFn: () => reportsApi.getReports(pagination),
    staleTime: 30000
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => reportsApi.generateReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report generated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to generate report');
    }
  });
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: (reportId) => reportsApi.downloadReport(reportId),
    onSuccess: (blob, reportId) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report downloaded');
    },
    onError: (error) => {
      toast.error('Failed to download report');
    }
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reportId) => reportsApi.deleteReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete report');
    }
  });
}
