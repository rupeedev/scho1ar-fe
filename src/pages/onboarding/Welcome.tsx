import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingDown, BarChart3, Shield, Zap, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import { useOnboarding } from '@/hooks/use-onboarding';

const Welcome = () => {
  const navigate = useNavigate();
  const { setCurrentStep } = useOnboarding();

  const features = [
    {
      icon: <TrendingDown className="h-6 w-6 text-blue-600" />,
      title: "Reduce Cloud Costs by 40%",
      description: "AI-powered optimization automatically identifies and eliminates waste."
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-green-600" />,
      title: "Real-time Analytics",
      description: "Get instant visibility into your cloud spending patterns."
    },
    {
      icon: <Shield className="h-6 w-6 text-purple-600" />,
      title: "Enterprise Security",
      description: "Bank-level security with SOC 2 compliance."
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-600" />,
      title: "Automated Optimization",
      description: "Set it and forget it - optimize 24/7 automatically."
    }
  ];

  const benefits = [
    "Setup takes less than 5 minutes",
    "Start saving money immediately", 
    "No long-term contracts required",
    "Cancel anytime with full data export"
  ];

  const handleGetStarted = () => {
    setCurrentStep(2);
    navigate('/onboarding/organization');
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={4}
      title="Welcome to Scho1ar Solution!"
      description="Let's get your cloud cost optimization journey started in just a few minutes."
    >
      <div className="space-y-8">
        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits List */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">What you'll get:</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Success Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">40%</div>
              <div className="text-sm text-gray-600">Average Cost Reduction</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">500+</div>
              <div className="text-sm text-gray-600">Companies Trust Us</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">$2.3M</div>
              <div className="text-sm text-gray-600">Total Savings Generated</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            onClick={handleSkip}
            variant="outline" 
            size="lg" 
            className="text-lg px-8 py-4"
          >
            Skip Setup
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              Free 14-day trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              Cancel anytime
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default Welcome;