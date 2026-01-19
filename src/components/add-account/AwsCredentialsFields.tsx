
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AwsCredentialsFieldsProps {
  roleArn: string;
  externalId: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AwsCredentialsFields: React.FC<AwsCredentialsFieldsProps> = ({
  roleArn,
  externalId,
  handleInputChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="roleArn">Role ARN</Label>
        <Input 
          id="roleArn" 
          name="roleArn" 
          value={roleArn}
          onChange={handleInputChange}
          placeholder="arn:aws:iam::999999999999:role/Scho1arRole" 
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="externalId">External ID</Label>
        <Input 
          id="externalId" 
          name="externalId" 
          value={externalId}
          onChange={handleInputChange}
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          A string of characters consisting of upper- and lower-case alphanumeric
          characters with no spaces. You can also include underscores or any of the
          following characters: =,@:/-
        </p>
      </div>
    </div>
  );
};

export default AwsCredentialsFields;
