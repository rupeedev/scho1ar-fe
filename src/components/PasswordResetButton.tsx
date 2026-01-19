import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

const PasswordResetButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  
  const handlePasswordReset = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error('User email not found');
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success('Password reset link sent to your email');
      toast.info('Please check your email inbox to reset your password');
      
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      onClick={handlePasswordReset}
      disabled={loading}
      className="border-gray-300"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Mail className="mr-2 h-4 w-4" />
      )}
      Reset Password via Email
    </Button>
  );
};

export default PasswordResetButton;