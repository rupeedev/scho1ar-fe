
import React, { useState } from 'react';
import { Save, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AccountBreadcrumbs from '@/components/add-account/AccountBreadcrumbs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { organizationsApi } from '@/lib/api/organizations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  cloudAccountsApi,
  CloudAccountCredentials,
  CreateCloudAccountDto
} from '@/lib/api/cloud-accounts';

const AddAccount = () => {
  const [authMethod, setAuthMethod] = useState<'access_key' | 'iam_role'>('access_key');
  const [accountData, setAccountData] = useState({
    name: '',
    accessKeyId: '',
    secretAccessKey: '',
    roleArn: '',
    externalId: '',
    accountId: '', // AWS account ID
    region: 'us-east-1' // Default region
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get user's organizations
  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.getAll,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRegionChange = (value: string) => {
    setAccountData(prev => ({ ...prev, region: value }));
    
    // Clear error for region if it exists
    if (errors.region) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.region;
        return newErrors;
      });
    }
  };


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!accountData.name.trim()) {
      newErrors.name = "Account name is required";
    }

    if (!accountData.accountId.trim()) {
      newErrors.accountId = "AWS Account ID is required";
    } else if (!/^\d{12}$/.test(accountData.accountId)) {
      newErrors.accountId = "AWS Account ID must be a 12-digit number";
    }

    if (authMethod === 'access_key') {
      if (!accountData.accessKeyId.trim()) {
        newErrors.accessKeyId = "Access Key ID is required";
      }

      if (!accountData.secretAccessKey.trim()) {
        newErrors.secretAccessKey = "Secret Access Key is required";
      }
    } else {
      // IAM Role validation
      if (!accountData.roleArn.trim()) {
        newErrors.roleArn = "IAM Role ARN is required";
      } else if (!accountData.roleArn.startsWith('arn:aws:iam::')) {
        newErrors.roleArn = "Invalid Role ARN format";
      }
    }

    if (!accountData.region.trim()) {
      newErrors.region = "AWS Region is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Map form data to API DTO based on auth method
      const credentials: CloudAccountCredentials = authMethod === 'access_key'
        ? {
            access_key_id: accountData.accessKeyId,
            secret_access_key: accountData.secretAccessKey
          }
        : {
            role_arn: accountData.roleArn,
            external_id: accountData.externalId || undefined
          };

      // Get the user's organization ID
      const organizationId = organizations?.[0]?.id;

      if (!organizationId) {
        toast({
          title: "No Organization Found",
          description: "Please create an organization first.",
          variant: "destructive",
        });
        navigate('/onboarding/organization');
        return;
      }

      const createAccountData: CreateCloudAccountDto = {
        name: accountData.name,
        provider: 'aws',
        account_id_on_provider: accountData.accountId,
        access_type: authMethod === 'access_key' ? 'access_key' : 'role_arn',
        permission_type: 'readwrite',
        region: accountData.region,
        credentials
      };

      // Call API to create cloud account
      await cloudAccountsApi.create(organizationId, createAccountData);

      // Show success toast
      toast({
        title: "Success",
        description: "Cloud account created successfully",
      });

      // Navigate to onboarding page with state to trigger refresh
      navigate('/onboarding', { state: { fromAccountCreation: true } });
    } catch (error) {
      console.error('Error creating cloud account:', error);
      // Show error toast
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create cloud account",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formHasErrors = Object.keys(errors).length > 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <AccountBreadcrumbs />
            
            <form onSubmit={handleSubmit}>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Add AWS Account</h2>
                      <p className="text-gray-600">Connect your AWS account using access keys or IAM role</p>
                    </div>

                    {formHasErrors && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Please fix the errors below before submitting.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Authentication Method Selection */}
                    <div>
                      <Label className="mb-3 block">Authentication Method</Label>
                      <RadioGroup value={authMethod} onValueChange={(value: 'access_key' | 'iam_role') => {
                        setAuthMethod(value);
                        setErrors({});
                      }}>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="access_key" id="access_key" />
                          <Label htmlFor="access_key" className="font-normal cursor-pointer">
                            Access Keys (Access Key ID & Secret Access Key)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="iam_role" id="iam_role" />
                          <Label htmlFor="iam_role" className="font-normal cursor-pointer">
                            IAM Role (Role ARN)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="name">Account Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={accountData.name}
                        onChange={handleInputChange}
                        placeholder="My AWS Account"
                        className="mt-1"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="accountId">AWS Account ID</Label>
                      <Input
                        id="accountId"
                        name="accountId"
                        value={accountData.accountId}
                        onChange={handleInputChange}
                        placeholder="732262065619"
                        className="mt-1"
                      />
                      {errors.accountId && (
                        <p className="text-sm text-red-500 mt-1">{errors.accountId}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="region">AWS Region</Label>
                      <Select value={accountData.region} onValueChange={handleRegionChange}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select AWS Region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us-east-1">US East (N. Virginia) - us-east-1</SelectItem>
                          <SelectItem value="us-east-2">US East (Ohio) - us-east-2</SelectItem>
                          <SelectItem value="us-west-1">US West (N. California) - us-west-1</SelectItem>
                          <SelectItem value="us-west-2">US West (Oregon) - us-west-2</SelectItem>
                          <SelectItem value="eu-west-1">Europe (Ireland) - eu-west-1</SelectItem>
                          <SelectItem value="eu-west-2">Europe (London) - eu-west-2</SelectItem>
                          <SelectItem value="eu-central-1">Europe (Frankfurt) - eu-central-1</SelectItem>
                          <SelectItem value="ap-south-1">Asia Pacific (Mumbai) - ap-south-1</SelectItem>
                          <SelectItem value="ap-southeast-1">Asia Pacific (Singapore) - ap-southeast-1</SelectItem>
                          <SelectItem value="ap-southeast-2">Asia Pacific (Sydney) - ap-southeast-2</SelectItem>
                          <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo) - ap-northeast-1</SelectItem>
                          <SelectItem value="ca-central-1">Canada (Central) - ca-central-1</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.region && (
                        <p className="text-sm text-red-500 mt-1">{errors.region}</p>
                      )}
                    </div>

                    {/* Conditional rendering based on auth method */}
                    {authMethod === 'access_key' ? (
                      <>
                        <div>
                          <Label htmlFor="accessKeyId">AWS Access Key ID</Label>
                          <Input
                            id="accessKeyId"
                            name="accessKeyId"
                            value={accountData.accessKeyId}
                            onChange={handleInputChange}
                            placeholder="AKIAIOSFODNN7EXAMPLE"
                            className="mt-1"
                          />
                          {errors.accessKeyId && (
                            <p className="text-sm text-red-500 mt-1">{errors.accessKeyId}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="secretAccessKey">AWS Secret Access Key</Label>
                          <Input
                            id="secretAccessKey"
                            name="secretAccessKey"
                            type="password"
                            value={accountData.secretAccessKey}
                            onChange={handleInputChange}
                            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                            className="mt-1"
                          />
                          {errors.secretAccessKey && (
                            <p className="text-sm text-red-500 mt-1">{errors.secretAccessKey}</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="roleArn">IAM Role ARN</Label>
                          <Input
                            id="roleArn"
                            name="roleArn"
                            value={accountData.roleArn}
                            onChange={handleInputChange}
                            placeholder="arn:aws:iam::123456789012:role/CostPieRole"
                            className="mt-1"
                          />
                          {errors.roleArn && (
                            <p className="text-sm text-red-500 mt-1">{errors.roleArn}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="externalId">External ID (Optional)</Label>
                          <Input
                            id="externalId"
                            name="externalId"
                            value={accountData.externalId}
                            onChange={handleInputChange}
                            placeholder="unique-external-id-12345"
                            className="mt-1"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            External ID for additional security when assuming the role
                          </p>
                        </div>
                      </>
                    )}
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="flex items-center gap-2"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Adding Account...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Add Account
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAccount;
