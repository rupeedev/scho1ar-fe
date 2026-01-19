import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, ExternalLink, BookOpen, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import { useOnboarding } from '@/hooks/use-onboarding';

const SetupComplete = () => {
  const navigate = useNavigate();
  const { data, markCompleted } = useOnboarding();

  const nextSteps = [
    {
      icon: <ExternalLink className="h-5 w-5 text-blue-600" />,
      title: "Connect Your First Cloud Account",
      description: "Add your AWS, Azure, or GCP account to start tracking costs",
      action: "Add Account",
      route: "/add-account"
    },
    {
      icon: <BookOpen className="h-5 w-5 text-green-600" />,
      title: "Explore the Dashboard",
      description: "See your cost analytics, trends, and optimization recommendations",
      action: "View Dashboard",
      route: "/dashboard"
    },
    {
      icon: <HelpCircle className="h-5 w-5 text-purple-600" />,
      title: "Get Help & Support",
      description: "Access documentation, tutorials, and customer support",
      action: "Help Center",
      route: "#"
    }
  ];

  const handleGoToDashboard = () => {
    markCompleted();
    navigate('/dashboard');
  };

  const handleNextStep = (route: string) => {
    markCompleted();
    if (route.startsWith('#')) {
      // External link or help
      return;
    }
    navigate(route);
  };

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={4}
      title="Welcome to CostPie!"
      description="Your account is ready. Here's what you can do next."
    >
      <div className="space-y-8">
        {/* Success Message */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h2>
            <p className="text-gray-600">
              Your organization "{data.organizationData.name}" has been successfully created.
            </p>
          </CardContent>
        </Card>

        {/* Setup Summary */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Setup Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Organization:</span>
                <span className="font-medium">{data.organizationData.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{data.organizationData.type.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Team Size:</span>
                <span className="font-medium">{data.organizationData.teamSize} employees</span>
              </div>
              {data.organizationData.industry && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Industry:</span>
                  <span className="font-medium">{data.organizationData.industry}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  14-Day Free Trial
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Recommended Next Steps</h3>
          <div className="grid gap-4">
            {nextSteps.map((step, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 p-2 bg-gray-100 rounded-md">
                        {step.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">{step.title}</h4>
                        <p className="text-gray-600 text-sm">{step.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNextStep(step.route)}
                    >
                      {step.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main CTA */}
        <div className="text-center pt-6">
          <Button
            onClick={handleGoToDashboard}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            You can always access these options from your dashboard later.
          </p>
        </div>

        {/* Help Section */}
        <Card className="bg-gray-50">
          <CardContent className="p-6 text-center">
            <h4 className="font-medium text-gray-900 mb-2">Need Help Getting Started?</h4>
            <p className="text-gray-600 text-sm mb-4">
              Our team is here to help you get the most out of CostPie.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="sm">
                View Documentation
              </Button>
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </OnboardingLayout>
  );
};

export default SetupComplete;