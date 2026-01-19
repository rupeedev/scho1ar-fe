import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  TrendingDown,
  Shield,
  Zap,
  BarChart3,
  CheckCircle,
  DollarSign,
  Cloud,
  Cpu,
  LineChart,
  Settings,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  const features = [
    {
      icon: <TrendingDown className="h-6 w-6" />,
      title: "Cost Optimization",
      description: "AI-powered analysis identifies unused resources and right-sizes your infrastructure automatically."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Real-time Analytics",
      description: "Get instant visibility into your cloud spending patterns with detailed breakdowns and forecasting."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Multi-Cloud Security",
      description: "Secure monitoring across AWS, Azure, and GCP with enterprise-grade encryption."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Automated Actions",
      description: "Schedule resource management and let our algorithms optimize your cloud 24/7."
    },
    {
      icon: <LineChart className="h-6 w-6" />,
      title: "Cost Forecasting",
      description: "Predict future spending with ML-powered forecasting and budget alerts."
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Custom Policies",
      description: "Define optimization rules that match your organization's unique requirements."
    }
  ];

  const stats = [
    { value: "40%", label: "Average Cost Reduction" },
    { value: "$2.3M", label: "Total Savings Generated" },
    { value: "500+", label: "Companies Trust Us" },
    { value: "99.9%", label: "Uptime Guarantee" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1a65d5] rounded-lg flex items-center justify-center">
                <Cloud className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-gray-900">Scho1ar</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">How it Works</a>
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Pricing</Link>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Contact</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-sm font-medium">Sign In</Button>
              </Link>
              <Link to="/login">
                <Button className="bg-[#1a65d5] hover:bg-[#1454b8] text-sm font-medium px-5">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/80 to-white pointer-events-none" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#1a65d5]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a65d5]/10 rounded-full mb-8">
              <span className="w-2 h-2 bg-[#1a65d5] rounded-full animate-pulse" />
              <span className="text-sm font-medium text-[#1a65d5]">Trusted by 500+ companies worldwide</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
              10x Your Cloud
              <br />
              <span className="text-[#1a65d5]">Cost Efficiency</span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed mb-10 max-w-2xl">
              AI-powered cloud cost management that automatically optimizes your infrastructure,
              eliminates waste, and delivers actionable insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/login">
                <Button size="lg" className="bg-[#1a65d5] hover:bg-[#1454b8] text-base font-medium px-8 h-14 rounded-xl">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="text-base font-medium px-8 h-14 rounded-xl border-gray-300 hover:bg-gray-50">
                  View Pricing
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Everything you need to
              <br />
              <span className="text-[#1a65d5]">optimize cloud costs</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to give you complete visibility and control over your cloud spending.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-white border border-gray-200 rounded-2xl hover:border-[#1a65d5]/30 hover:shadow-lg hover:shadow-[#1a65d5]/5 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-[#1a65d5]/10 rounded-xl flex items-center justify-center text-[#1a65d5] mb-5 group-hover:bg-[#1a65d5] group-hover:text-white transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-gray-900 text-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-5xl font-bold mb-6 tracking-tight">
                Reduce costs by
                <br />
                <span className="text-[#1a65d5]">40% or more</span>
              </h2>
              <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                Our AI continuously analyzes your cloud infrastructure, identifies optimization opportunities,
                and implements changes automatically—so you can focus on building, not budgeting.
              </p>

              <div className="space-y-5 mb-10">
                {[
                  "Instant cost savings discovery",
                  "Automated resource right-sizing",
                  "Multi-cloud unified dashboard",
                  "Predictive cost forecasting",
                  "Custom alert notifications"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#1a65d5]/20 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-[#1a65d5]" />
                    </div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>

              <Link to="/login">
                <Button size="lg" className="bg-[#1a65d5] hover:bg-[#1454b8] text-base font-medium px-8 h-14 rounded-xl">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="bg-gray-800 rounded-2xl p-8 lg:p-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-gray-700">
                  <span className="text-gray-400">Monthly Cloud Bill</span>
                  <span className="text-2xl font-bold text-red-400">$12,450</span>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-700">
                  <span className="text-gray-400">After Scho1ar Optimization</span>
                  <span className="text-2xl font-bold text-green-400">$7,470</span>
                </div>
                <div className="flex items-center justify-between py-4">
                  <span className="text-white font-semibold">Monthly Savings</span>
                  <span className="text-3xl font-bold text-[#1a65d5]">$4,980</span>
                </div>
                <div className="bg-[#1a65d5]/10 p-5 rounded-xl">
                  <div className="text-[#1a65d5] font-semibold text-lg mb-1">40% Cost Reduction</div>
                  <div className="text-gray-400 text-sm">$59,760 saved annually</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Built for enterprise
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Security and compliance at the core of everything we do.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Lock className="h-6 w-6" />,
                title: "SOC 2 Compliant",
                description: "Enterprise-grade security with SOC 2 Type II certification."
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Data Encryption",
                description: "AES-256 encryption for all data at rest and in transit."
              },
              {
                icon: <Cpu className="h-6 w-6" />,
                title: "99.9% Uptime",
                description: "Guaranteed availability with redundant infrastructure."
              }
            ].map((item, index) => (
              <div key={index} className="text-center p-8">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600 mx-auto mb-5">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 bg-[#1a65d5]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            Ready to optimize your cloud?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join hundreds of companies saving millions on cloud costs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="bg-white text-[#1a65d5] hover:bg-gray-100 text-base font-medium px-8 h-14 rounded-xl">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-base font-medium px-8 h-14 rounded-xl border-white/30 text-white hover:bg-white/10">
              Schedule Demo
            </Button>
          </div>

          <p className="text-sm text-white/60 mt-6">
            No credit card required • Setup in minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#1a65d5] rounded-lg flex items-center justify-center">
                  <Cloud className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold">Scho1ar</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                The smart way to optimize your cloud costs and maximize your infrastructure ROI.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Scho1ar Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
