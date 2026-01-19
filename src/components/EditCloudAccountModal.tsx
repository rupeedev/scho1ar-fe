import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { cloudAccountsApi, CloudAccount, UpdateCloudAccountDto } from '@/lib/api/cloud-accounts';

interface EditCloudAccountModalProps {
  account: CloudAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditCloudAccountModal = ({ account, isOpen, onClose, onSuccess }: EditCloudAccountModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    permission_type: 'readonly' as 'readonly' | 'readwrite',
    region: 'us-east-1',
    access_key_id: '',
    secret_access_key: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Reset form when account changes
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        permission_type: account.permission_type as 'readonly' | 'readwrite',
        region: account.region || 'us-east-1',
        access_key_id: '',
        secret_access_key: '',
      });
      setErrors({});
    }
  }, [account]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Account name is required";
    }
    
    if (!formData.region) {
      newErrors.region = "AWS Region is required";
    }
    
    // If credentials are provided, both fields are required
    if (formData.access_key_id || formData.secret_access_key) {
      if (!formData.access_key_id.trim()) {
        newErrors.access_key_id = "Access Key ID is required when updating credentials";
      }
      if (!formData.secret_access_key.trim()) {
        newErrors.secret_access_key = "Secret Access Key is required when updating credentials";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account || !validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData: UpdateCloudAccountDto = {};
      
      // Only include fields that have meaningful values
      if (formData.name?.trim()) {
        updateData.name = formData.name.trim();
      }
      
      if (formData.permission_type) {
        updateData.permission_type = formData.permission_type;
      }
      
      if (formData.region) {
        updateData.region = formData.region;
      }

      // Only include credentials if they were provided
      if (formData.access_key_id?.trim() && formData.secret_access_key?.trim()) {
        updateData.credentials = {
          access_key_id: formData.access_key_id.trim(),
          secret_access_key: formData.secret_access_key.trim(),
        };
      }

      await cloudAccountsApi.update(account.id, updateData);
      
      toast({
        title: 'Account Updated',
        description: 'Cloud account has been successfully updated.',
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating cloud account:', error);
      
      // Provide specific error messages for common validation issues
      let errorMessage = 'Failed to update cloud account. Please try again.';
      
      if (error.message?.includes('region should not exist')) {
        errorMessage = 'Region updates are temporarily unavailable. Your other changes have been attempted.';
        
        // Retry without region field if region validation fails
        try {
          const retryData = { ...updateData };
          delete retryData.region;
          
          if (Object.keys(retryData).length > 0) {
            await cloudAccountsApi.update(account.id, retryData);
            toast({
              title: 'Partial Update Successful',
              description: 'Account updated successfully. Region changes are temporarily unavailable.',
            });
            onSuccess();
            onClose();
            return;
          }
        } catch (retryError) {
          console.error('Retry without region also failed:', retryError);
        }
      } else if (error.message?.includes('ValidationError')) {
        errorMessage = 'Invalid data provided. Please check your inputs and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setErrors({});
    }
  };

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Cloud Account</DialogTitle>
          <DialogDescription>
            Update your cloud account settings. Leave credential fields empty to keep existing credentials.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-account-name">
                Account Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-account-name"
                placeholder="e.g., Production AWS"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={errors.name ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-permission-type">
                Permission Type <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.permission_type} 
                onValueChange={(value: 'readonly' | 'readwrite') => 
                  setFormData(prev => ({ ...prev, permission_type: value }))
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select permission type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="readonly">Read Only</SelectItem>
                  <SelectItem value="readwrite">Read/Write</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-region">
              AWS Region <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.region} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}
              disabled={loading}
            >
              <SelectTrigger className={errors.region ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select AWS region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                <SelectItem value="ap-southeast-2">Asia Pacific (Sydney)</SelectItem>
              </SelectContent>
            </Select>
            {errors.region && (
              <p className="text-sm text-red-500">{errors.region}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>Update credentials (optional - leave empty to keep existing)</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-access-key-id">
                  Access Key ID
                </Label>
                <Input
                  id="edit-access-key-id"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  value={formData.access_key_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, access_key_id: e.target.value }))}
                  className={errors.access_key_id ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.access_key_id && (
                  <p className="text-sm text-red-500">{errors.access_key_id}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-secret-access-key">
                  Secret Access Key
                </Label>
                <Input
                  id="edit-secret-access-key"
                  type="password"
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  value={formData.secret_access_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, secret_access_key: e.target.value }))}
                  className={errors.secret_access_key ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.secret_access_key && (
                  <p className="text-sm text-red-500">{errors.secret_access_key}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Account'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCloudAccountModal;