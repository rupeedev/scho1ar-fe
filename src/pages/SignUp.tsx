import { SignUp } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useClerkAuth } from '@/hooks/use-clerk-auth';

const SignUpPage = () => {
  const navigate = useNavigate();
  const { isSignedIn, loading } = useClerkAuth();

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (!loading && isSignedIn) {
      navigate('/dashboard');
    }
  }, [isSignedIn, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg',
          },
        }}
        routing="path"
        path="/signup"
        signInUrl="/login"
        afterSignUpUrl="/onboarding/welcome"
      />
    </div>
  );
};

export default SignUpPage;
