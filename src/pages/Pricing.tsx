import { useState } from 'react';
import { Check, ArrowRight, Zap, TrendingDown, Shield, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useStripeCheckout } from '@/hooks/use-stripe-checkout';
import { useClerkAuth } from '@/hooks/use-clerk-auth';
import { toast } from 'sonner';

interface PricingTier {
  id: 'starter' | 'professional' | 'enterprise';
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyPriceId: string;
  annualPriceId: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  limits: {
    cloudAccounts: string;
    projects: string;
    teamMembers: string;
    support: string;
  };
}

const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small teams starting cloud cost management',
    monthlyPrice: 19,
    annualPrice: 190,
    monthlyPriceId: import.meta.env.VITE_STRIPE_STARTER_MONTHLY,
    annualPriceId: import.meta.env.VITE_STRIPE_STARTER_ANNUAL,
    icon: <TrendingDown className="h-6 w-6 text-blue-600" />,
    limits: {
      cloudAccounts: '2 accounts',
      projects: '3 projects',
      teamMembers: '5 users',
      support: 'Email support'
    },
    features: [
      'Basic cost tracking and monitoring',
      'Monthly cost reports',
      'Budget alerts (5 alerts)',
      'Resource tagging',
      'Cost trend analysis',
      '6 months cost history',
      'Email support'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Advanced optimization for growing companies',
    monthlyPrice: 39,
    annualPrice: 390,
    monthlyPriceId: import.meta.env.VITE_STRIPE_PROFESSIONAL_MONTHLY,
    annualPriceId: import.meta.env.VITE_STRIPE_PROFESSIONAL_ANNUAL,
    popular: true,
    icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
    limits: {
      cloudAccounts: '10 accounts',
      projects: '15 projects',  
      teamMembers: '25 users',
      support: 'Email + Chat'
    },
    features: [
      'Everything in Starter',
      'Advanced cost optimization recommendations',
      'Multi-cloud support (AWS + Azure)',
      'Custom dashboards (15 dashboards)',
      'Budget alerts (50 alerts)',
      'Cost forecasting (3 months)',
      'Reserved instance analysis',
      'Auto-tagging and smart categorization',
      '2 years cost history',
      'Priority email + chat support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Complete cost governance for large organizations',
    monthlyPrice: 99,
    annualPrice: 990,
    monthlyPriceId: import.meta.env.VITE_STRIPE_ENTERPRISE_MONTHLY,
    annualPriceId: import.meta.env.VITE_STRIPE_ENTERPRISE_ANNUAL,
    icon: <Shield className="h-6 w-6 text-blue-600" />,
    limits: {
      cloudAccounts: 'Unlimited',
      projects: 'Unlimited',
      teamMembers: 'Unlimited',
      support: '24/7 Phone'
    },
    features: [
      'Everything in Professional',
      'Unlimited cloud accounts and projects',
      'All cloud providers supported',
      'Advanced AI-powered recommendations',
      'Cost forecasting (12 months)',
      'Custom integrations and API access',
      'SSO and enterprise security',
      'White-label options',
      '5 years cost history',
      'Dedicated customer success manager',
      '24/7 phone support',
      'Professional services included'
    ]
  }
];

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { redirectToCheckout } = useStripeCheckout();
  const { user } = useClerkAuth();

  const handleSelectPlan = async (tier: PricingTier) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    const priceId = isAnnual ? tier.annualPriceId : tier.monthlyPriceId;
    
    try {
      await redirectToCheckout(priceId, {
        customerEmail: user.email,
        clientReferenceId: user.id
      });
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to redirect to checkout. Please try again or contact support.');
    }
  };

  const getPrice = (tier: PricingTier) => {
    return isAnnual ? tier.annualPrice : tier.monthlyPrice;
  };

  const getSavings = (tier: PricingTier) => {
    const monthlyCost = tier.monthlyPrice * 12;
    const annualCost = tier.annualPrice;
    const savings = monthlyCost - annualCost;
    return savings;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200">
            <Zap className="h-3 w-3 mr-1" />
            Save 40% on Cloud Costs
          </Badge>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Choose the perfect plan to optimize your cloud costs and boost your bottom line. 
            All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <Label htmlFor="billing-toggle" className={`text-lg ${!isAnnual ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="billing-toggle" className={`text-lg ${isAnnual ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              Annual
            </Label>
            {isAnnual && (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                Save 2 months
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-20">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative transition-all duration-300 hover:shadow-2xl ${
                tier.popular 
                  ? 'border-blue-500 border-2 shadow-xl scale-105' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1 text-sm">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-4">
                  {tier.icon}
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {tier.name}
                </CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  {tier.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Pricing */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      ${getPrice(tier)}
                    </span>
                    <span className="text-gray-500 ml-2">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-green-600 mt-2">
                      Save ${getSavings(tier)} annually
                    </p>
                  )}
                </div>

                {/* Key Limits */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Cloud Accounts:</span>
                      <div className="font-semibold">{tier.limits.cloudAccounts}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Projects:</span>
                      <div className="font-semibold">{tier.limits.projects}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Team Members:</span>
                      <div className="font-semibold">{tier.limits.teamMembers}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Support:</span>
                      <div className="font-semibold">{tier.limits.support}</div>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  onClick={() => handleSelectPlan(tier)}
                  className={`w-full py-6 text-lg font-semibold transition-all duration-300 ${
                    tier.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                      : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {user ? 'Get Started' : 'Sign Up & Get Started'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Value Proposition */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="bg-blue-600 text-white rounded-2xl p-8 mb-12">
            <h3 className="text-2xl font-bold mb-4">
              ROI Guarantee: Save 5x Your Subscription Cost
            </h3>
            <p className="text-blue-100 text-lg">
              Our customers typically save $150-$1,000+ monthly in cloud costs. 
              That's 5-20x return on your CostPie investment.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <p className="text-gray-600">Companies trust CostPie</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">$2.3M+</div>
              <p className="text-gray-600">Total savings delivered</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">40%</div>
              <p className="text-gray-600">Average cost reduction</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Do you offer a free trial?
              </h4>
              <p className="text-gray-600">
                Yes! All plans include a 14-day free trial with full access to Professional features. 
                No credit card required to start.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Can I change plans later?
              </h4>
              <p className="text-gray-600">
                Absolutely! You can upgrade or downgrade your plan at any time. 
                Changes take effect immediately with prorated billing.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                What cloud providers do you support?
              </h4>
              <p className="text-gray-600">
                Starter supports AWS. Professional adds Azure. Enterprise supports all major 
                cloud providers including AWS, Azure, GCP, and more.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Is my data secure?
              </h4>
              <p className="text-gray-600">
                Yes! We use enterprise-grade security with SOC 2 compliance, encryption at rest 
                and in transit, and never store your cloud credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}