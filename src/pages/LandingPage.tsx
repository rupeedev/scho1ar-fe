import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  TrendingDown, 
  Shield, 
  Zap, 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle,
  Star,
  Play,
  DollarSign,
  Gauge,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const LandingPage = () => {
  const features = [
    {
      icon: <TrendingDown className="h-8 w-8 text-blue-600" />,
      title: "Reduce Cloud Costs by 40%",
      description: "AI-powered optimization identifies unused resources and right-sizes your infrastructure automatically."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-green-600" />,
      title: "Real-time Cost Analytics",
      description: "Get instant visibility into your cloud spending patterns with detailed breakdowns and forecasting."
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-600" />,
      title: "Multi-Cloud Security",
      description: "Secure monitoring across AWS, Azure, and GCP with enterprise-grade encryption and compliance."
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: "Automated Optimization",
      description: "Set it and forget it. Our smart algorithms continuously optimize your cloud resources 24/7."
    }
  ];

  const benefits = [
    "Instant cost savings discovery",
    "Automated resource right-sizing",
    "Multi-cloud unified dashboard",
    "Predictive cost forecasting",
    "Custom alert notifications",
    "Detailed usage analytics"
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CTO at TechFlow",
      company: "TechFlow Solutions",
      content: "Scho1ar Solution helped us reduce our AWS bill by 35% in the first month. The insights are incredible!",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "DevOps Lead",
      company: "DataDrive Inc",
      content: "Finally, a tool that makes cloud cost optimization simple. Our team loves the automated recommendations.",
      rating: 5
    },
    {
      name: "Jennifer Park",
      role: "Finance Director",
      company: "ScaleUp Ventures",
      content: "The cost forecasting feature helped us budget accurately and avoid surprise bills.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "Perfect for small teams getting started",
      features: [
        "Up to 3 cloud accounts",
        "Basic cost analytics",
        "Email notifications",
        "7-day free trial"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Professional",
      price: "$99",
      period: "/month",
      description: "Ideal for growing businesses",
      features: [
        "Unlimited cloud accounts",
        "Advanced analytics & forecasting",
        "Automated optimization",
        "Priority support",
        "Custom integrations"
      ],
      cta: "Get Started",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations with complex needs",
      features: [
        "Everything in Professional",
        "Dedicated account manager",
        "Custom reporting",
        "SLA guarantees",
        "Advanced security features"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Scho1ar Solution</span>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-600 hover:text-gray-900 font-medium">A(I)nfra</a>
              <a href="https://app.scho1ar.com/about" className="text-gray-600 hover:text-gray-900 font-medium">iKanban</a>
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
              <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/login">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
              🚀 Trusted by 500+ Companies
            </Badge>
            
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Slash Your Cloud Costs by
              <span className="text-blue-600"> 40% or More</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Scho1ar Solution's AI-powered platform automatically optimizes your cloud infrastructure, 
              eliminates waste, and provides actionable insights to reduce your monthly bills.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link to="/login">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                  Start 14-Day Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-blue-600 text-blue-600 hover:bg-blue-50">
                  <DollarSign className="mr-2 h-5 w-5" />
                  View Pricing
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Setup in 5 minutes
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">40%</div>
              <div className="text-gray-600">Average Cost Reduction</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">$2.3M</div>
              <div className="text-gray-600">Total Savings Generated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">500+</div>
              <div className="text-gray-600">Companies Trust Us</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">99.9%</div>
              <div className="text-gray-600">Uptime Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Optimize Cloud Costs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to give you complete visibility and control over your cloud spending.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Why Choose Scho1ar Solution for Cloud Optimization?
              </h2>
              <p className="text-blue-100 text-lg mb-8">
                Join hundreds of companies who have already transformed their cloud spending with our intelligent platform.
              </p>
              
              <div className="grid gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                    <span className="text-white">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Link to="/login">
                  <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Monthly Cloud Bill</span>
                  <span className="text-2xl font-bold text-red-600">$12,450</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">After Scho1ar Solution Optimization</span>
                  <span className="text-2xl font-bold text-green-600">$7,470</span>
                </div>
                <hr />
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 font-semibold">Monthly Savings</span>
                  <span className="text-3xl font-bold text-blue-600">$4,980</span>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-green-800 font-semibold">40% Cost Reduction</div>
                  <div className="text-green-600 text-sm">$59,760 saved annually</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Loved by Cloud Engineers Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers say about their cost optimization journey
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                    <div className="text-sm text-gray-500">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that's right for your team. All plans include our core optimization features.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative hover:shadow-lg transition-shadow duration-300 ${plan.popular ? 'border-2 border-blue-500' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/login">
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Saving on Cloud Costs?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of companies already optimizing their cloud infrastructure with Scho1ar Solution.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                Start Free 14-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 text-white border-white hover:bg-white hover:text-gray-900">
              Schedule Demo
            </Button>
          </div>
          
          <p className="text-sm text-gray-400 mt-4">
            No credit card required • Setup in minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Scho1ar Solution</span>
              </div>
              <p className="text-gray-600 mb-4">
                The smart way to optimize your cloud costs and maximize your infrastructure ROI.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#features" className="hover:text-gray-900">Features</a></li>
                <li><a href="#pricing" className="hover:text-gray-900">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900">Integrations</a></li>
                <li><a href="#" className="hover:text-gray-900">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900">About</a></li>
                <li><a href="#" className="hover:text-gray-900">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900">Careers</a></li>
                <li><a href="#" className="hover:text-gray-900">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Help Center</a></li>
                <li><a href="#" className="hover:text-gray-900">Documentation</a></li>
                <li><a href="#" className="hover:text-gray-900">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gray-900">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
            <p>&copy; 2025 Scho1ar Solution Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;