import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // With Clerk, password reset is handled through the sign-in page
    // Redirect to login after a short delay
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Lock className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Password Reset
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Password reset is now managed through our secure sign-in page.
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            You will be redirected to the login page where you can use the "Forgot password?" link to reset your password.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
