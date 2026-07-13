import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageSkeleton } from './page-skeleton';

export default function ProtectedRoute() {
  const { token, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
