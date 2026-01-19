import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Settings, LogOut } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

export const ActionButtons: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useSupabaseAuth();

  const handleLogout = async () => {
    try {
      await signOut();

      // Show logout toast
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });

      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/order-history')}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Order History
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};