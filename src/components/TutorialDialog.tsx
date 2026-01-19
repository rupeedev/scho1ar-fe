
import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

interface TutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TutorialDialog: React.FC<TutorialDialogProps> = ({ open, onOpenChange }) => {
  const [tutorialStep, setTutorialStep] = useState(1);
  const totalSteps = 6;

  const handleNext = () => {
    if (tutorialStep < totalSteps) {
      setTutorialStep(prev => prev + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    if (tutorialStep > 1) {
      setTutorialStep(prev => prev - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="absolute right-4 top-4">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <DialogHeader>
          <DialogTitle>Welcome to Scho1ar Solution!</DialogTitle>
          <DialogDescription>
            This guide will help you to get comfortable with the system.
            Just click on this button anytime when you need to see it again. Click "Next" to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-blue-500 p-6 w-40 h-40 flex items-center justify-center">
              <div className="text-white text-6xl font-bold">CP</div>
            </div>
          </div>

          <div className="grid gap-4">
            {tutorialStep === 1 && (
              <div>
                <div className="text-sm">
                  <ol className="list-decimal pl-5 space-y-4">
                    <li>
                      Click the button below to launch the CloudFormation Stack. When prompted to log in to AWS, use your AWS account credentials.
                      <div className="mt-2">
                        <Button className="flex items-center gap-2 w-full justify-center bg-blue-500 hover:bg-blue-600">
                          <Check className="h-4 w-4" />
                          Launch CloudFormation Stack
                        </Button>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            )}
            
            {tutorialStep === 2 && (
              <div>
                <div className="text-sm">
                  <ol className="list-decimal pl-5 space-y-4" start={2}>
                    <li>
                      Check <span className="font-medium">I acknowledge that AWS CloudFormation might create IAM resources with custom names</span> checkbox.
                    </li>
                  </ol>
                </div>
              </div>
            )}
            
            {tutorialStep === 3 && (
              <div>
                <div className="text-sm">
                  <ol className="list-decimal pl-5 space-y-4" start={3}>
                    <li>
                      Click <span className="font-medium">Create stack</span> button and wait for the operation to complete.
                    </li>
                  </ol>
                </div>
              </div>
            )}
            
            {tutorialStep === 4 && (
              <div>
                <div className="text-sm">
                  <ol className="list-decimal pl-5 space-y-4" start={4}>
                    <li>
                      Use <Check className="inline h-4 w-4" /> button to track the operation progress if needed.
                    </li>
                  </ol>
                </div>
              </div>
            )}
            
            {tutorialStep === 5 && (
              <div>
                <div className="text-sm">
                  <ol className="list-decimal pl-5 space-y-4" start={5}>
                    <li>
                      Wait until both <span className="font-medium">Scho1ar SolutionRole</span> and <span className="font-medium">Scho1ar SolutionPolicy</span> have <span className="text-green-500 font-medium">CREATE_COMPLETE</span> status.
                    </li>
                  </ol>
                </div>
              </div>
            )}
            
            {tutorialStep === 6 && (
              <div>
                <div className="text-sm">
                  <ol className="list-decimal pl-5 space-y-4" start={6}>
                    <li>
                      Open <span className="font-medium">Outputs</span> tab and use <span className="font-medium">Role ARN</span> and <span className="font-medium">External ID</span> values to add your AWS account to Scho1ar Solution.
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between border-t pt-4 mt-4">
          <div className="flex items-center">
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 w-1.5 rounded-full ${
                    i + 1 === tutorialStep ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleBack} disabled={tutorialStep === 1}>
              Back
            </Button>
            <Button size="sm" onClick={handleNext}>
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialDialog;
