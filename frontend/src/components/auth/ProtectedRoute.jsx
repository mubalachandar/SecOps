import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useGetMe } from '../../hooks/useAuth';

export default function ProtectedRoute() {
  const { isAuthenticated, setUser } = useAuthStore();
  const { data: user } = useGetMe();

  // If useQuery returns user, ensure it's in the store
  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
