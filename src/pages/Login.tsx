import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { LogIn } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isForgotPassword) {
        await resetPassword(email);
        toast({
          title: "Password reset email sent!",
          description: "Please check your email for the password reset link.",
        });
        setIsForgotPassword(false); // Switch back to login view
      } else if (isSignUp) {
        await signUp(email, password);
        toast({
          title: "Sign up successful!",
          description: "Please check your email for verification, then sign in to continue.",
        });
        setIsSignUp(false); // Switch back to login view
      } else {
        await signIn(email, password);
        toast({
          title: "Login successful!",
          description: "Welcome back to the dashboard.",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      toast({
        title: isForgotPassword ? "Password reset failed" : isSignUp ? "Sign up failed" : "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setIsForgotPassword(true);
    setIsSignUp(false);
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setIsSignUp(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isForgotPassword ? 'Reset your password' : isSignUp ? 'Create an account' : 'Sign in to your account'}
          </CardTitle>
          {isForgotPassword && (
            <p className="text-sm text-gray-600 text-center">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {!isForgotPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {!isSignUp && (
                    <Button 
                      variant="link" 
                      className="px-0 font-normal text-xs" 
                      type="button"
                      onClick={handleForgotPassword}
                    >
                      Forgot password?
                    </Button>
                  )}
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}
            {!isSignUp && !isForgotPassword && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm font-normal">Remember me</Label>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isForgotPassword ? 'Sending reset email...' : isSignUp ? 'Creating account...' : 'Signing in...'}
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  {isForgotPassword ? 'Send Reset Email' : isSignUp ? 'Sign Up' : 'Sign In'}
                </div>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-sm text-center text-gray-500 mt-2">
            {isForgotPassword ? (
              <>
                Remember your password?{' '}
                <Button 
                  variant="link" 
                  className="p-0" 
                  onClick={handleBackToLogin}
                  type="button"
                >
                  Back to sign in
                </Button>
              </>
            ) : (
              <>
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <Button 
                  variant="link" 
                  className="p-0" 
                  onClick={() => setIsSignUp(!isSignUp)}
                  type="button"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </Button>
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;