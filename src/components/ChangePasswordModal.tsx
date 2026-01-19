import React from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useClerk } from '@clerk/clerk-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { openUserProfile } = useClerk();

  const handleOpenSecuritySettings = () => {
    // Open Clerk's user profile to the security section
    openUserProfile();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Change Password</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            To change your password, please use your account security settings.
          </p>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-blue-500 hover:bg-blue-600"
              onClick={handleOpenSecuritySettings}
            >
              Open Security Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
