import { create } from 'zustand';

export const useAuthStore = create((set) => {
  const token = sessionStorage.getItem('token');
  
  return {
    user: null,
    token: token || null,
    isAuthenticated: !!token,
    isLoading: false,
    
    setUser: (user) => set({ user }),
    setToken: (token) => set({ token }),
    setLoading: (isLoading) => set({ isLoading }),
    
    login: (user, token) => {
      sessionStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
    },
    
    logout: () => {
      sessionStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  };
});
