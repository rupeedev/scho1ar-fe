import { Navigate, Outlet } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

type ProtectedRouteProps = {
  redirectPath?: string;
};

export const SupabaseProtectedRoute = ({
  redirectPath = '/login',
}: ProtectedRouteProps) => {
  const { user, loading } = useSupabaseAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  // Otherwise, render the protected component
  return <Outlet />;
};

export default SupabaseProtectedRoute;