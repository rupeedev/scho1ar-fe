import React from 'react';
import { Button } from "@/components/ui/button";
import { Settings } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';

const PasswordResetButton: React.FC = () => {
  const { openUserProfile } = useClerk();

  const handleOpenSecuritySettings = () => {
    // Open Clerk's user profile modal for security settings
    openUserProfile();
  };

  return (
    <Button
      variant="outline"
      onClick={handleOpenSecuritySettings}
      className="border-gray-300"
    >
      <Settings className="mr-2 h-4 w-4" />
      Manage Security Settings
    </Button>
  );
};

export default PasswordResetButton;
