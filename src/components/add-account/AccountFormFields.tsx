
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AccountFormFieldsProps {
  accountData: {
    name: string;
    accessType: string;
    permissionType: string;
    setupMethod: string;
    roleArn: string;
    externalId: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRadioChange: (name: string, value: string) => void;
  handleAccessTypeChange: (value: string) => void;
}

const AccountFormFields: React.FC<AccountFormFieldsProps> = ({ 
  accountData, 
  handleInputChange, 
  handleRadioChange,
  handleAccessTypeChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="accountName">Account Name</Label>
        <Input 
          id="accountName" 
          name="name" 
          value={accountData.name}
          onChange={handleInputChange}
          placeholder="Production" 
          className="mt-1"
        />
      </div>
      
      <div>
        <Label>Access Type</Label>
        <div className="mt-1">
          <Select value={accountData.accessType} onValueChange={handleAccessTypeChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select access type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="access-key">By access key (credentials access)</SelectItem>
              <SelectItem value="role-arn">By role ARN (cross-account access)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label>Permission Type</Label>
        <RadioGroup 
          value={accountData.permissionType}
          onValueChange={(value) => handleRadioChange('permissionType', value)}
          className="flex gap-6 mt-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="default" id="default" />
            <Label htmlFor="default">Default</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="read-only" id="read-only" />
            <Label htmlFor="read-only">Read-only</Label>
          </div>
        </RadioGroup>
        <p className="text-sm text-gray-500 mt-1">
          It is recommended to use the default option. Select the read-only option only if
          you don't intend to use scheduling or control resource states on this account.
        </p>
      </div>
      
      <div>
        <Label>Setup Method</Label>
        <RadioGroup 
          value={accountData.setupMethod}
          onValueChange={(value) => handleRadioChange('setupMethod', value)}
          className="flex gap-6 mt-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="automatic" id="automatic" />
            <Label htmlFor="automatic">Automatic</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual">Manual</Label>
          </div>
        </RadioGroup>
        <p className="text-sm text-gray-500 mt-1">
          In automatic mode, CloudFormation performs all the configuration steps for you.<br />
          In manual mode, you will be doing it by yourself.
        </p>
      </div>
    </div>
  );
};

export default AccountFormFields;
