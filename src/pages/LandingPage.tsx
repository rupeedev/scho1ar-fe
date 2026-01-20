import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Cloud,
  Cpu,
  Bot,
  Workflow,
  BarChart3,
  Calendar,
  Code2,
  Shield,
  Lock,
  Zap,
  CheckCircle,
  CircleDot,
  Database,
  Server,
  GitBranch,
  Terminal,
  Sparkles,
  Clock,
  TrendingDown,
  LineChart,
  Users,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  const journeySteps = [
    {
      step: '01',
      title: 'Connect',
      description: 'Connect your AWS accounts securely with read-only IAM roles. Multi-cloud support coming soon.',
      icon: <Cloud className="h-6 w-6" />,
      color: 'bg-blue-500'
    },
    {
      step: '02',
      title: 'Discover',
      description: 'AI automatically discovers all resources, maps dependencies, and analyzes spending patterns.',
      icon: <Database className="h-6 w-6" />,
      color: 'bg-purple-500'
    },
    {
      step: '03',
      title: 'Analyze',
      description: 'Get actionable insights on cost optimization, security posture, and infrastructure health.',
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'bg-green-500'
    },
    {
      step: '04',
      title: 'Optimize',
      description: 'Implement scheduling, right-sizing, and automated recommendations to cut costs by 40%.',
      icon: <TrendingDown className="h-6 w-6" />,
      color: 'bg-orange-500'
    },
    {
      step: '05',
      title: 'Automate',
      description: 'Use AI agents, self-service templates, and APIs to automate your cloud operations.',
      icon: <Bot className="h-6 w-6" />,
      color: 'bg-pink-500'
    },
    {
      step: '06',
      title: 'Scale',
      description: 'Enterprise-grade workflows, approval processes, and multi-team collaboration.',
      icon: <Building2 className="h-6 w-6" />,
      color: 'bg-indigo-500'
    }
  ];

  const capabilities = [
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Cost Management',
      description: 'Real-time cost analytics, trend analysis, health scoring, and ML-powered forecasting. Export reports and set budget alerts.',
      features: ['Cost Explorer Integration', 'Trend Analysis', 'Budget Alerts', 'Custom Reports']
    },
    {
      icon: <Server className="h-8 w-8" />,
      title: 'Infrastructure Provisioning',
      description: 'AI-powered infrastructure creation. Define resources in JSON, and let our agent provision VPCs, RDS, ECS, and more.',
      features: ['JSON Config Templates', 'VPC/Subnet Setup', 'RDS Provisioning', 'ECS Deployments']
    },
    {
      icon: <Bot className="h-8 w-8" />,
      title: 'AI Agent',
      description: 'Chat with your infrastructure using our LLM agent. RAG-powered context, tool execution, and streaming responses.',
      features: ['Natural Language Queries', 'RAG Pipeline', 'Tool Execution', 'Memory & Context']
    },
    {
      icon: <Workflow className="h-8 w-8" />,
      title: 'Developer Self-Service',
      description: 'Internal Developer Platform with templates, approval workflows, environment management, and resource quotas.',
      features: ['Service Templates', 'Approval Workflows', 'Environment Mgmt', 'Resource Quotas']
    },
    {
      icon: <Code2 className="h-8 w-8" />,
      title: 'Automation API',
      description: 'Public REST API with OpenAPI spec, API keys, SDKs, webhooks, and CI/CD integration for GitOps workflows.',
      features: ['OpenAPI 3.0 Spec', 'API Key Auth', 'Webhooks', 'CI/CD Integration']
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: 'Resource Scheduling',
      description: 'Schedule resources to start/stop automatically. Timezone support, conflict detection, and execution history.',
      features: ['Start/Stop Schedules', 'Timezone Support', 'Conflict Detection', 'Execution History']
    }
  ];

  const techHighlights = [
    { label: 'Backend', value: 'Rust + Axum', icon: <Terminal className="h-4 w-4" /> },
    { label: 'Workflows', value: 'Temporal', icon: <Workflow className="h-4 w-4" /> },
    { label: 'AI/LLM', value: 'Claude + RAG', icon: <Sparkles className="h-4 w-4" /> },
    { label: 'Database', value: 'PostgreSQL + pgvector', icon: <Database className="h-4 w-4" /> }
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
              <span className="text-xl font-semibold tracking-tight text-gray-900">Scho1ar Solutions</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#journey" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Journey</a>
              <a href="#capabilities" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Capabilities</a>
              <a href="#ai-agent" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">AI Agent</a>
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Pricing</Link>
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
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/80 to-white pointer-events-none" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#1a65d5]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1a65d5]/10 to-purple-500/10 rounded-full mb-8">
              <Sparkles className="h-4 w-4 text-[#1a65d5]" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Cloud Infrastructure Platform</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
              Your Cloud Journey,
              <br />
              <span className="bg-gradient-to-r from-[#1a65d5] to-purple-600 bg-clip-text text-transparent">Intelligently Automated</span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed mb-10 max-w-2xl">
              From cost optimization to infrastructure provisioning, Scho1ar's AI agents manage your entire cloud lifecycle.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/login">
                <Button size="lg" className="bg-[#1a65d5] hover:bg-[#1454b8] text-base font-medium px-8 h-14 rounded-xl">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#journey">
                <Button variant="outline" size="lg" className="text-base font-medium px-8 h-14 rounded-xl border-gray-300 hover:bg-gray-50">
                  See How It Works
                </Button>
              </a>
            </div>

            {/* Tech Stack Pills */}
            <div className="flex flex-wrap gap-3">
              {techHighlights.map((tech, index) => (
                <div key={index} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                  <span className="text-gray-500">{tech.icon}</span>
                  <span className="text-sm text-gray-600">{tech.label}:</span>
                  <span className="text-sm font-medium text-gray-900">{tech.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section id="journey" className="py-24 lg:py-32 bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Your Cloud Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A complete path from connecting your first account to fully automated cloud operations.
            </p>
          </div>

          {/* Journey Timeline */}
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {journeySteps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-[#1a65d5]/30 hover:shadow-lg transition-all duration-300 h-full">
                    {/* Step Number */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center text-white`}>
                        {step.icon}
                      </div>
                      <span className="text-4xl font-bold text-gray-200">{step.step}</span>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Platform Capabilities
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Six integrated pillars that transform how you manage cloud infrastructure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((capability, index) => (
              <div
                key={index}
                className="group p-8 bg-white border border-gray-200 rounded-2xl hover:border-[#1a65d5]/30 hover:shadow-xl hover:shadow-[#1a65d5]/5 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#1a65d5]/10 to-purple-500/10 rounded-2xl flex items-center justify-center text-[#1a65d5] mb-6 group-hover:scale-110 transition-transform duration-300">
                  {capability.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{capability.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{capability.description}</p>

                <div className="flex flex-wrap gap-2">
                  {capability.features.map((feature, fIndex) => (
                    <span key={fIndex} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Agent Section */}
      <section id="ai-agent" className="py-24 lg:py-32 bg-gray-900 text-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a65d5]/20 rounded-full mb-6">
                <Bot className="h-4 w-4 text-[#1a65d5]" />
                <span className="text-sm font-medium text-[#1a65d5]">LLM Agent with RAG</span>
              </div>

              <h2 className="text-3xl lg:text-5xl font-bold mb-6 tracking-tight">
                Chat with Your
                <br />
                <span className="text-[#1a65d5]">Infrastructure</span>
              </h2>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                Our AI agent understands your entire cloud environment. Ask questions, request changes,
                or let it proactively suggest optimizations using Claude and retrieval-augmented generation.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  { icon: <Sparkles className="h-5 w-5" />, text: 'Natural language queries about your infrastructure' },
                  { icon: <Database className="h-5 w-5" />, text: 'RAG pipeline with pgvector for semantic search' },
                  { icon: <Workflow className="h-5 w-5" />, text: 'LangGraph state machine for complex workflows' },
                  { icon: <Zap className="h-5 w-5" />, text: 'Streaming responses with real-time tool execution' },
                  { icon: <Clock className="h-5 w-5" />, text: 'Multi-tier memory: short-term, long-term, entity' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1a65d5]/20 flex items-center justify-center text-[#1a65d5]">
                      {item.icon}
                    </div>
                    <span className="text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>

              <Link to="/login">
                <Button size="lg" className="bg-[#1a65d5] hover:bg-[#1454b8] text-base font-medium px-8 h-14 rounded-xl">
                  Try the AI Agent
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Chat Interface Preview */}
            <div className="bg-gray-800 rounded-2xl p-6 lg:p-8 border border-gray-700">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-700">
                <Bot className="h-6 w-6 text-[#1a65d5]" />
                <span className="font-semibold">Scho1ar Agent</span>
                <span className="ml-auto text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Online</span>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs">U</div>
                  <div className="flex-1 bg-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-300">Which EC2 instances have been idle for the last 7 days?</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a65d5] flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1 bg-[#1a65d5]/10 rounded-xl p-4 border border-[#1a65d5]/20">
                    <p className="text-sm text-gray-300 mb-3">I found 3 idle EC2 instances in your us-east-1 account:</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between p-2 bg-gray-800 rounded">
                        <span className="text-gray-400">i-0a1b2c3d4e5f</span>
                        <span className="text-orange-400">$47.20/mo</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-800 rounded">
                        <span className="text-gray-400">i-1b2c3d4e5f6</span>
                        <span className="text-orange-400">$23.60/mo</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-800 rounded">
                        <span className="text-gray-400">i-2c3d4e5f6g7</span>
                        <span className="text-orange-400">$94.40/mo</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#1a65d5] mt-3">Potential savings: $165.20/month</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask about your infrastructure..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#1a65d5]"
                  readOnly
                />
                <Button className="bg-[#1a65d5] hover:bg-[#1454b8] px-4 rounded-xl">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Platform Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Code/Template Preview */}
            <div className="order-2 lg:order-1">
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 font-mono text-sm">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-gray-500 text-xs">service-template.json</span>
                </div>
                <pre className="text-gray-300 overflow-x-auto">
{`{
  "name": "web-service",
  "type": "ecs-fargate",
  "config": {
    "cpu": 256,
    "memory": 512,
    "desiredCount": 2,
    "healthCheck": "/health",
    "autoScaling": {
      "min": 2,
      "max": 10,
      "targetCPU": 70
    }
  },
  "approval": {
    "required": true,
    "approvers": ["platform-team"]
  },
  "quotas": {
    "maxInstances": 20,
    "maxCostPerMonth": 500
  }
}`}
                </pre>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full mb-6">
                <GitBranch className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Internal Developer Platform</span>
              </div>

              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                Self-Service
                <br />
                <span className="text-[#1a65d5]">Infrastructure</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Empower developers with pre-approved templates while maintaining governance.
                Define quotas, require approvals, and track all provisioning requests.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  'Service templates for common patterns',
                  'Approval workflows with Slack/Teams integration',
                  'Environment management (dev/staging/prod)',
                  'Resource quotas and cost guardrails',
                  'Full audit trail of all changes'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <Link to="/login">
                <Button size="lg" className="bg-[#1a65d5] hover:bg-[#1454b8] text-base font-medium px-8 h-14 rounded-xl">
                  Explore Templates
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Automation API Section */}
      <section className="py-24 lg:py-32 bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full mb-6">
              <Code2 className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Automation API</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              API-First Platform
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you can do in the UI, you can do via API. Perfect for GitOps, CI/CD pipelines, and custom integrations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Code2 className="h-6 w-6" />, title: 'OpenAPI 3.0', description: 'Full spec with interactive docs' },
              { icon: <Lock className="h-6 w-6" />, title: 'API Keys', description: 'Scoped keys with rate limits' },
              { icon: <Terminal className="h-6 w-6" />, title: 'SDKs', description: 'TypeScript, Python, Go clients' },
              { icon: <GitBranch className="h-6 w-6" />, title: 'Webhooks', description: 'Real-time event notifications' }
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 text-center">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>

          {/* API Code Example */}
          <div className="mt-12 bg-gray-900 rounded-2xl p-6 lg:p-8 border border-gray-800">
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-mono rounded">GET</span>
              <code className="text-gray-400 text-sm">/api/v1/resources?type=ec2&status=running</code>
            </div>
            <pre className="text-sm text-gray-300 overflow-x-auto">
{`curl -X GET "https://api.scho1ar.com/v1/resources?type=ec2&status=running" \\
  -H "Authorization: Bearer sk_live_xxxxx" \\
  -H "Content-Type: application/json"

# Response
{
  "data": [
    {
      "id": "res_abc123",
      "type": "ec2",
      "name": "web-server-1",
      "status": "running",
      "cost": { "daily": 3.24, "monthly": 97.20 },
      "tags": { "env": "production", "team": "platform" }
    }
  ],
  "meta": { "total": 42, "page": 1, "per_page": 20 }
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Enterprise-Grade Security
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built with security and reliability at every layer.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: <Lock className="h-6 w-6" />, title: 'Read-Only Access', description: 'IAM roles with minimal permissions' },
              { icon: <Shield className="h-6 w-6" />, title: 'Data Encryption', description: 'AES-256 at rest, TLS in transit' },
              { icon: <Cpu className="h-6 w-6" />, title: '99.9% Uptime', description: 'Redundant infrastructure' },
              { icon: <Users className="h-6 w-6" />, title: 'Multi-Tenant', description: 'Isolated organization data' }
            ].map((item, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600 mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 bg-gradient-to-r from-[#1a65d5] to-purple-600">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            Start Your Cloud Journey Today
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            From cost optimization to AI-powered automation, transform how you manage cloud infrastructure.
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
            No credit card required • Connect your first account in minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#1a65d5] rounded-lg flex items-center justify-center">
                  <Cloud className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold">Scho1ar Solutions</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                AI-powered cloud infrastructure platform. From cost optimization to automated provisioning.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Platform</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a></li>
                <li><a href="#ai-agent" className="hover:text-white transition-colors">AI Agent</a></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Scho1ar Solutions Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
