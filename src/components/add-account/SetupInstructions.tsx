
import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";

interface SetupInstructionsProps {
  setupMethod: string;
}

const SetupInstructions: React.FC<SetupInstructionsProps> = ({ setupMethod }) => {
  const jsonPolicy = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "organizations:DescribeOrganization",
        "iam:SimulatePrincipalPolicy",
        "sts:GetCallerIdentity",
        "ce:GetDimensionValues",
        "ce:GetCostAndUsage",
        "ce:GetRightsizingRecommendation",
        "compute-optimizer:GetEC2InstanceRecommendations",
        "compute-optimizer:GetEBSVolumeRecommendations",
        "compute-optimizer:GetAutoScalingGroupRecommendations",
        "compute-optimizer:GetECSServiceRecommendations"
      ],
      "Resource": "*"
    }
  ]
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonPolicy);
    toast.success("JSON policy copied to clipboard");
  };

  if (setupMethod === 'automatic') {
    return (
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
        <h3 className="text-sm font-medium mb-2">Automatic Setup</h3>
        <p className="text-sm text-gray-500 mb-4">
          We will configure all necessary permissions automatically.
          Click the button below to start the CloudFormation setup process.
        </p>
        <Button>Launch CloudFormation</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-6">
        <h3 className="text-sm font-medium text-blue-700 mb-1">Step 1: Create Policy</h3>
        
        <ol className="list-decimal ml-5 text-sm space-y-2">
          <li>Log in to AWS console.</li>
          <li>Navigate to IAM policies.</li>
          <li>Click on Create policy button.</li>
          <li>Navigate to JSON tab.</li>
          <li>Copy & paste CloudAvocado policy JSON configuration.</li>
        </ol>
        
        <div className="mt-4 bg-white border border-gray-200 rounded-md overflow-hidden">
          <pre className="overflow-auto p-3 text-xs text-pink-600 max-h-60">
            {jsonPolicy}
          </pre>
          <div className="border-t border-gray-200 p-2 bg-gray-50 flex justify-end">
            <Button variant="outline" size="sm" className="text-xs" onClick={handleCopy}>
              <Copy className="mr-1 h-3 w-3" /> Copy
            </Button>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-6">
        <h3 className="text-sm font-medium text-blue-700">Step 2: Grant User Permissions</h3>
        <p className="text-sm mt-2">
          After creating the policy, assign it to the IAM user whose credentials you will use for access.
        </p>
      </div>
    </div>
  );
};

export default SetupInstructions;
