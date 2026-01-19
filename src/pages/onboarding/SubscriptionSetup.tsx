import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Star, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import { useOnboarding } from '@/hooks/use-onboarding';

const SubscriptionSetup = () => {
  const navigate = useNavigate();
  const { data, updateSubscriptionData, setCurrentStep } = useOnboarding();
  const [selectedPlan, setSelectedPlan] = useState(data.subscriptionData.planId || 'trial');

  const plans = [
    {
      id: 'trial',
      name: 'Free Trial',
      price: '$0',
      period: '/14 days',
      description: 'Perfect for trying out CostPie',
      features: [
        'Up to 3 cloud accounts',
        'Basic cost analytics',
        'Email notifications',
        '14-day free trial',
        'Community support'
      ],
      recommended: false,
      badge: 'FREE TRIAL'
    },
    {
      id: 'starter',
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'Perfect for small teams getting started',
      features: [
        'Up to 10 cloud accounts',
        'Advanced cost analytics',
        'Real-time alerts',
        'Basic optimization recommendations',
        'Email support'
      ],
      recommended: true,
      badge: 'MOST POPULAR'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$99',
      period: '/month',
      description: 'Ideal for growing businesses',
      features: [
        'Unlimited cloud accounts',
        'Advanced analytics & forecasting',
        'Automated optimization',
        'Priority support',
        'Custom integrations',
        'API access'
      ],
      recommended: false,
      badge: 'ADVANCED'
    }
  ];

  const handleContinue = () => {
    updateSubscriptionData({ planId: selectedPlan });
    setCurrentStep(4);
    navigate('/onboarding/complete');
  };

  const handleBack = () => {
    setCurrentStep(2);
    navigate('/onboarding/organization');
  };

  const handleStartTrial = () => {
    updateSubscriptionData({ planId: 'trial' });
    setCurrentStep(4);
    navigate('/onboarding/complete');
  };

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={4}
      title="Choose Your Plan"
      description="Select the plan that best fits your needs. You can always upgrade later."
    >
      <div className="space-y-8">
        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedPlan === plan.id
                  ? 'border-2 border-blue-500 shadow-lg'
                  : plan.recommended
                  ? 'border-2 border-green-500'
                  : 'border border-gray-200'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardContent className="p-6">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  {plan.recommended && (
                    <Badge className="mb-2 bg-green-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      {plan.badge}
                    </Badge>
                  )}
                  {plan.id === 'trial' && (
                    <Badge className="mb-2 bg-blue-500 text-white">
                      {plan.badge}
                    </Badge>
                  )}
                  {plan.id === 'professional' && (
                    <Badge className="mb-2 bg-purple-500 text-white">
                      {plan.badge}
                    </Badge>
                  )}
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Selection Indicator */}
                {selectedPlan === plan.id && (
                  <div className="text-center">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      <Check className="h-4 w-4 mr-1" />
                      Selected
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trial Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 p-2 bg-blue-100 rounded-md">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Free Trial Information</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Start with a 14-day free trial (no credit card required)</li>
                  <li>• Access all Starter plan features during your trial</li>
                  <li>• Cancel anytime before trial ends with no charges</li>
                  <li>• Upgrade, downgrade, or cancel anytime after trial</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleStartTrial}
            >
              Start Free Trial
            </Button>
            <Button
              onClick={handleContinue}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue with {plans.find(p => p.id === selectedPlan)?.name}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-1" />
              No setup fees
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-1" />
              Cancel anytime
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-1" />
              30-day money back guarantee
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default SubscriptionSetup;