import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export function useLogin() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: (credentials) => api.post('/auth/login', credentials).then(r => r.data),
    onSuccess: (data) => {
      const user = data?.data?.user;
      const token = data?.data?.token;
      if (user && token) {
        login(user, token);
        navigate('/');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Login failed';
      toast.error(message);
    }
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return () => {
    api.post('/auth/logout')
      .catch((e) => console.error('Logout error', e))
      .finally(() => {
        logout();
        queryClient.clear();
        navigate('/login');
      });
  };
}

export function useGetMe() {
  const { isAuthenticated, setUser } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then(r => r.data.data),
    enabled: isAuthenticated,
    staleTime: 300000
  });
}

export function useUpdateProfile() {
  const { setUser } = useAuthStore();
  
  return useMutation({
    mutationFn: (data) => api.put('/auth/profile', data).then(r => r.data),
    onSuccess: (data) => {
      const user = data?.data?.user;
      if (user) {
        setUser(user);
        toast.success('Profile updated successfully');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Failed to update profile';
      toast.error(message);
    }
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data) => api.put('/auth/password', data).then(r => r.data),
    onSuccess: () => {
      toast.success('Password updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Failed to update password';
      toast.error(message);
    }
  });
}
