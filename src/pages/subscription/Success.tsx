import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, CreditCard, Calendar, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SubscriptionDetails {
  id: string;
  plan: string;
  amount: number;
  currency: string;
  interval: string;
  status: string;
  currentPeriodEnd: string;
  customerEmail: string;
}

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // In a real app, you'd call your backend to get subscription details
      // For now, we'll simulate the data
      setTimeout(() => {
        setSubscriptionDetails({
          id: 'sub_example123',
          plan: 'Professional',
          amount: 39,
          currency: 'USD',
          interval: 'month',
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          customerEmail: 'user@example.com'
        });
        setLoading(false);
      }, 1500);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  if (!sessionId || !subscriptionDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Session</CardTitle>
            <CardDescription>
              We couldn't find your subscription details. Please contact support if you believe this is an error.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/pricing')} variant="outline">
              Return to Pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-6">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Scho1ar Solution!
            </h1>
            
            <p className="text-xl text-gray-600 mb-6">
              Your subscription has been successfully activated. You now have access to all {subscriptionDetails.plan} features.
            </p>

            <Badge className="bg-green-100 text-green-700 text-lg px-4 py-2">
              Subscription Active
            </Badge>
          </div>

          {/* Subscription Details Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                Subscription Details
              </CardTitle>
              <CardDescription>
                Here are the details of your new subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Plan</label>
                  <p className="text-lg font-semibold text-gray-900">{subscriptionDetails.plan}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatAmount(subscriptionDetails.amount, subscriptionDetails.currency)}
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      /{subscriptionDetails.interval}
                    </span>
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-lg font-semibold text-green-600 capitalize">{subscriptionDetails.status}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Next Billing Date</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(subscriptionDetails.currentPeriodEnd)}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-gray-500">Subscription ID</label>
                <p className="text-sm font-mono text-gray-700 bg-gray-50 p-2 rounded">
                  {subscriptionDetails.id}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>
                Get the most out of your Scho1ar Solution subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg bg-blue-50">
                  <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Access Dashboard</h3>
                  <p className="text-sm text-gray-600">
                    Start exploring your premium features and set up your first cloud account
                  </p>
                </div>

                <div className="text-center p-4 rounded-lg bg-green-50">
                  <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Connect Cloud Accounts</h3>
                  <p className="text-sm text-gray-600">
                    Link your AWS, Azure, or other cloud accounts to start tracking costs
                  </p>
                </div>

                <div className="text-center p-4 rounded-lg bg-purple-50">
                  <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Get Support</h3>
                  <p className="text-sm text-gray-600">
                    Need help? Our support team is ready to assist you with setup
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <Button
              onClick={() => navigate('/dashboard')}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <div className="space-x-4">
              <Button
                onClick={() => navigate('/add-account')}
                variant="outline"
                size="lg"
              >
                Connect Cloud Account
              </Button>
              
              <Button
                onClick={() => navigate('/settings')}
                variant="outline"
                size="lg"
              >
                Manage Subscription
              </Button>
            </div>
          </div>

          {/* Important Information */}
          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Important Information</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• You'll receive an email confirmation with your invoice shortly</li>
              <li>• Your subscription will automatically renew on {formatDate(subscriptionDetails.currentPeriodEnd)}</li>
              <li>• You can cancel or modify your subscription anytime from your account settings</li>
              <li>• Need help? Contact our support team at support@costpie.com</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}