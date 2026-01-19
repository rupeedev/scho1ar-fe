import React, { useState } from 'react';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Users,
  Zap,
  Shield,
  ChevronRight,
  Settings,
  Bell,
  FileText,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  RefreshCw,
  Filter
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const Billing = () => {
  const [autoRenew, setAutoRenew] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [usageAlerts, setUsageAlerts] = useState(true);

  // Mock data for current subscription
  const subscription = {
    plan: 'Professional',
    status: 'Active',
    price: 299,
    billingCycle: 'Monthly',
    nextBillingDate: '2025-02-01',
    startDate: '2024-01-01',
    cloudAccounts: { used: 8, limit: 15 },
    users: { used: 12, limit: 25 },
    apiCalls: { used: 450000, limit: 1000000 },
    dataRetention: '90 days',
    support: '24/7 Priority'
  };

  // Mock billing history
  const billingHistory = [
    { id: 'INV-2025-001', date: '2025-01-01', amount: 299, status: 'Paid', method: 'Visa •••• 4242' },
    { id: 'INV-2024-012', date: '2024-12-01', amount: 299, status: 'Paid', method: 'Visa •••• 4242' },
    { id: 'INV-2024-011', date: '2024-11-01', amount: 299, status: 'Paid', method: 'Visa •••• 4242' },
    { id: 'INV-2024-010', date: '2024-10-01', amount: 299, status: 'Paid', method: 'Visa •••• 4242' },
    { id: 'INV-2024-009', date: '2024-09-01', amount: 199, status: 'Paid', method: 'Visa •••• 4242' },
  ];

  // Calculate days until next billing
  const daysUntilBilling = () => {
    const today = new Date();
    const nextBilling = new Date(subscription.nextBillingDate);
    const diffTime = Math.abs(nextBilling.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Billing & Subscription</h1>
              <p className="text-gray-600">Manage your subscription, payment methods, and billing preferences</p>
            </div>

            {/* Date Range Filter */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>2025-01-01 - 2025-08-30</span>
              </div>
            </div>

            {/* Stats Overview - Similar to Cloud Ops */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              {/* Active Subscriptions */}
              <Card className="relative overflow-hidden bg-white border border-gray-200 shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Subscriptions</p>
                    <Package className="h-5 w-5 text-indigo-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">1</p>
                  <p className="text-xs text-gray-500 mt-1">Active subscriptions</p>
                </CardContent>
              </Card>

              {/* Monthly Cost */}
              <Card className="relative overflow-hidden bg-white border border-gray-200 shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Monthly Cost</p>
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">${subscription.price}</p>
                  <p className="text-xs text-gray-500 mt-1">Per month</p>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card className="relative overflow-hidden bg-white border border-gray-200 shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Payment Methods</p>
                    <CreditCard className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">1</p>
                  <p className="text-xs text-gray-500 mt-1">Cards on file</p>
                </CardContent>
              </Card>

              {/* Invoices */}
              <Card className="relative overflow-hidden bg-white border border-gray-200 shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Invoices</p>
                    <FileText className="h-5 w-5 text-amber-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">5</p>
                  <p className="text-xs text-gray-500 mt-1">Total invoices</p>
                </CardContent>
              </Card>
            </div>

            {/* Current Plan Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Subscription Status Card */}
              <Card className="relative overflow-hidden border border-gray-200 shadow-sm bg-white">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                      <h3 className="text-2xl font-bold text-gray-900">{subscription.plan}</h3>
                      <Badge className="mt-2 bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {subscription.status}
                      </Badge>
                    </div>
                    <Package className="h-8 w-8 text-blue-500" />
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Billing Cycle</span>
                      <span className="font-medium">{subscription.billingCycle}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Next Billing</span>
                      <span className="font-medium">{daysUntilBilling()} days</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                    Upgrade Plan
                  </Button>
                </CardContent>
              </Card>

              {/* Billing Amount Card */}
              <Card className="relative overflow-hidden border border-gray-200 shadow-sm bg-white">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Next Payment</p>
                      <h3 className="text-2xl font-bold text-gray-900">${subscription.price}</h3>
                      <p className="text-sm text-gray-500 mt-1">on {subscription.nextBillingDate}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-emerald-500" />
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Auto-renewal</span>
                      <Switch
                        checked={autoRenew}
                        onCheckedChange={setAutoRenew}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total this year</span>
                      <span className="font-medium text-emerald-600">${subscription.price * 12}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Update Payment Method
                  </Button>
                </CardContent>
              </Card>

              {/* Usage Overview Card */}
              <Card className="relative overflow-hidden border border-gray-200 shadow-sm bg-white">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Resource Usage</p>
                      <h3 className="text-2xl font-bold text-gray-900">68%</h3>
                      <p className="text-sm text-gray-500 mt-1">of plan limits</p>
                    </div>
                    <div className="relative w-20 h-20">
                      <svg className="transform -rotate-90 w-20 h-20">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="#8b5cf6"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 36 * 0.68} ${2 * Math.PI * 36}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-900">68%</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Cloud Accounts</span>
                        <span className="font-medium">{subscription.cloudAccounts.used}/{subscription.cloudAccounts.limit}</span>
                      </div>
                      <Progress value={(subscription.cloudAccounts.used / subscription.cloudAccounts.limit) * 100} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Team Members</span>
                        <span className="font-medium">{subscription.users.used}/{subscription.users.limit}</span>
                      </div>
                      <Progress value={(subscription.users.used / subscription.users.limit) * 100} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">API Calls</span>
                        <span className="font-medium">{(subscription.apiCalls.used / 1000).toFixed(0)}k/{(subscription.apiCalls.limit / 1000).toFixed(0)}k</span>
                      </div>
                      <Progress value={(subscription.apiCalls.used / subscription.apiCalls.limit) * 100} className="h-1.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="invoices" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-transparent border-b border-gray-200 p-0 h-auto rounded-none">
                <TabsTrigger value="invoices" className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 rounded-none">
                  <FileText className="w-4 h-4" />
                  Invoices
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 rounded-none">
                  <CreditCard className="w-4 h-4" />
                  Payment Methods
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 rounded-none">
                  <Settings className="w-4 h-4" />
                  Billing Settings
                </TabsTrigger>
              </TabsList>

              {/* Invoices Tab */}
              <TabsContent value="invoices">
                <Card>
                  <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>Download invoices and view payment history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billingHistory.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.id}</TableCell>
                            <TableCell>{invoice.date}</TableCell>
                            <TableCell>${invoice.amount}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{invoice.method}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payment Methods Tab */}
              <TabsContent value="payment">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Manage your payment methods and billing information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Primary Payment Method */}
                    <div className="border rounded-lg p-4 bg-blue-50/30">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">Visa ending in 4242</p>
                              <Badge className="bg-blue-100 text-blue-700">Primary</Badge>
                            </div>
                            <p className="text-sm text-gray-600">Expires 12/2025</p>
                            <p className="text-sm text-gray-500 mt-2">Last used on January 1, 2025</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>

                    {/* Add New Payment Method */}
                    <Button variant="outline" className="w-full">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Add New Payment Method
                    </Button>

                    {/* Billing Address */}
                    <div>
                      <h4 className="font-medium mb-3">Billing Address</h4>
                      <div className="border rounded-lg p-4 space-y-2">
                        <p className="text-sm">Acme Corporation</p>
                        <p className="text-sm text-gray-600">123 Business Street</p>
                        <p className="text-sm text-gray-600">San Francisco, CA 94105</p>
                        <p className="text-sm text-gray-600">United States</p>
                        <Button variant="outline" size="sm" className="mt-3">
                          Update Address
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>


              {/* Billing Settings Tab */}
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Billing Preferences</CardTitle>
                    <CardDescription>Configure billing notifications and preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Notification Settings */}
                    <div>
                      <h4 className="font-medium mb-4">Notification Settings</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-500">Receive billing updates via email</p>
                          </div>
                          <Switch
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Usage Alerts</p>
                            <p className="text-sm text-gray-500">Get notified when approaching usage limits</p>
                          </div>
                          <Switch
                            checked={usageAlerts}
                            onCheckedChange={setUsageAlerts}
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Auto-renewal Reminders</p>
                            <p className="text-sm text-gray-500">Reminder 7 days before renewal</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    {/* Billing Contact */}
                    <div>
                      <h4 className="font-medium mb-4">Billing Contact</h4>
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium">John Doe</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">billing@acme.com</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Update Contact</Button>
                      </div>
                    </div>

                    {/* Billing Currency */}
                    <div>
                      <h4 className="font-medium mb-4">Billing Currency</h4>
                      <Select defaultValue="usd">
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd">USD - US Dollar</SelectItem>
                          <SelectItem value="eur">EUR - Euro</SelectItem>
                          <SelectItem value="gbp">GBP - British Pound</SelectItem>
                          <SelectItem value="jpy">JPY - Japanese Yen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tax Information */}
                    <div>
                      <h4 className="font-medium mb-4">Tax Information</h4>
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-3">Add your tax ID for invoicing purposes</p>
                        <Button variant="outline" size="sm">Add Tax ID</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="justify-start">
                    <RefreshCw className="w-4 h-4 mr-2 text-blue-500" />
                    Change Billing Cycle
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Clock className="w-4 h-4 mr-2 text-purple-500" />
                    Pause Subscription
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <FileText className="w-4 h-4 mr-2 text-emerald-500" />
                    Request Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Billing;