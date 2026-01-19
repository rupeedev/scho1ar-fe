import { Navigate, Outlet } from 'react-router-dom';
import { useClerkAuth } from '@/hooks/use-clerk-auth';

type ProtectedRouteProps = {
  redirectPath?: string;
};

export const ClerkProtectedRoute = ({
  redirectPath = '/login',
}: ProtectedRouteProps) => {
  const { isSignedIn, loading } = useClerkAuth();

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
  if (!isSignedIn) {
    return <Navigate to={redirectPath} replace />;
  }

  // Otherwise, render the protected component
  return <Outlet />;
};

export default ClerkProtectedRoute;
