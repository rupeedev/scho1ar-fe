import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Download, CreditCard, Plus, Copy, Trash2, Save, Loader2, Key } from 'lucide-react';
import { toast } from "sonner";
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  settingsApi, 
  organizationsApi, 
  usersApi,
  UserNotificationSettings,
  OrganizationSettings,
  BillingSettings,
  Invoice,
  SSOSettings,
  UpdateNotificationSettingsDto,
  UpdateOrganizationSettingsDto
} from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

// Helper to convert 24-hour time string
const convertTo12Hour = (hour: number): string => {
  const period = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:00 ${period}`;
};

// Helper to parse 12-hour time string to 24-hour number
const parseTimeString = (timeString: string): number => {
  const [time, period] = timeString.split(' ');
  const [hourStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  
  if (period.toUpperCase() === 'PM' && hour < 12) {
    hour += 12;
  } else if (period.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return hour;
};

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [loading, setLoading] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [enableEmails, setEnableEmails] = useState(true);
  const [timeZone, setTimeZone] = useState("(GMT +00:00) UTC");
  const [fromTime, setFromTime] = useState("12:00 AM");
  const [toTime, setToTime] = useState("12:00 AM");
  const [companyName, setCompanyName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  // Settings data
  const [notificationSettings, setNotificationSettings] = useState<UserNotificationSettings | null>(null);
  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings | null>(null);
  const [billingSettings, setBillingSettings] = useState<BillingSettings | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ssoSettings, setSsoSettings] = useState<SSOSettings | null>(null);
  
  // Get the current organization ID and load initial data
  useEffect(() => {
    const fetchOrganizationId = async () => {
      try {
        const organizations = await organizationsApi.getAll();
        if (organizations && organizations.length > 0) {
          const orgId = organizations[0].id;
          setOrganizationId(orgId);
          setAccountId(orgId); // Using org ID as account ID for display
          
          // Load all settings data in parallel
          await loadSettingsData(orgId);
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch organization data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationId();
  }, [toast]);
  
  // Load all settings data for organization
  const loadSettingsData = async (orgId: string) => {
    setLoading(true);
    
    try {
      // Fetch all settings data in parallel
      const [notifications, orgSettings, billing, invoiceData, sso] = await Promise.all([
        settingsApi.getUserNotificationSettings().catch(() => null),
        settingsApi.getOrganizationSettings(orgId).catch(() => null),
        settingsApi.getBillingSettings(orgId).catch(() => null),
        settingsApi.getInvoices(orgId).catch(() => []),
        settingsApi.getSSOSettings(orgId).catch(() => null)
      ]);
      
      // Update state with fetched data
      if (notifications) {
        setNotificationSettings(notifications);
        setEnableEmails(notifications.email_notifications_enabled);
        setTimeZone(notifications.timezone);
        
        if (notifications.notification_hours_start !== undefined) {
          setFromTime(convertTo12Hour(notifications.notification_hours_start));
        }
        
        if (notifications.notification_hours_end !== undefined) {
          setToTime(convertTo12Hour(notifications.notification_hours_end));
        }
      }
      
      if (orgSettings) {
        setOrganizationSettings(orgSettings);
        setCompanyName(orgSettings.company_name);
      }
      
      if (billing) {
        setBillingSettings(billing);
      }
      
      if (invoiceData) {
        setInvoices(invoiceData);
      }
      
      if (sso) {
        setSsoSettings(sso);
      }
    } catch (error) {
      console.error('Error loading settings data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Account ID copied to clipboard',
    });
  };
  
  // Save notification settings
  const handleSaveNotifications = async () => {
    if (!notificationSettings) return;
    
    setSavingNotifications(true);
    
    try {
      const updatedSettings: UpdateNotificationSettingsDto = {
        email_notifications_enabled: enableEmails,
        timezone: timeZone,
        notification_hours_start: parseTimeString(fromTime),
        notification_hours_end: parseTimeString(toTime)
      };
      
      await settingsApi.updateUserNotificationSettings(updatedSettings);
      
      toast({
        title: 'Success',
        description: 'Notification settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification settings',
        variant: 'destructive',
      });
    } finally {
      setSavingNotifications(false);
    }
  };
  
  // Save account settings
  const handleSaveAccount = async () => {
    if (!organizationId) return;
    
    setSavingAccount(true);
    
    try {
      const updatedSettings: UpdateOrganizationSettingsDto = {
        company_name: companyName
      };
      
      await settingsApi.updateOrganizationSettings(organizationId, updatedSettings);
      
      toast({
        title: 'Success',
        description: 'Account settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving account settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save account settings',
        variant: 'destructive',
      });
    } finally {
      setSavingAccount(false);
    }
  };
  
  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!organizationId) return;
    
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await settingsApi.deleteOrganization(organizationId);
        toast({
          title: 'Account deleted',
          description: 'Your account has been successfully deleted',
        });
        navigate('/');
      } catch (error) {
        console.error('Error deleting account:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete account',
          variant: 'destructive',
        });
      }
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        {/* Blue notification banner */}
        <div className="bg-blue-50 border-b border-blue-100 p-2 text-sm text-blue-700">
          Your subscription trial period ends in {billingSettings?.trial_end_date ? Math.max(1, Math.ceil((new Date(billingSettings.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 1} day.
          <Link to="/" className="text-blue-700 font-medium hover:underline ml-1">Click here</Link> to set your default payment method.
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Breadcrumb */}
          <div className="px-6 py-4 flex items-center text-sm text-gray-600">
            <Link to="/" className="flex items-center hover:text-gray-900">
              <Home size={18} />
            </Link>
            <span className="mx-2">&gt;</span>
            <span className="font-medium">Settings</span>
          </div>

          <div className="px-6 pb-8">
            <Tabs defaultValue="notifications" className="w-full">
              <TabsList className="bg-transparent p-0 h-auto space-x-1 mb-6 border-b border-gray-200">
                <TabsTrigger
                  value="billing"
                  className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none px-4 py-2"
                >
                  Billing
                </TabsTrigger>
                <TabsTrigger
                  value="account"
                  className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none px-4 py-2"
                >
                  Account
                </TabsTrigger>
                <TabsTrigger
                  value="singleSignOn"
                  className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none px-4 py-2"
                >
                  Single Sign-On
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none px-4 py-2"
                >
                  Notifications
                </TabsTrigger>
              </TabsList>

              {/* Billing tab content */}
              <TabsContent value="billing" className="space-y-6">
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="animate-spin mr-2" size={20} />
                    <span>Loading billing information...</span>
                  </div>
                ) : (
                  <>
                    {/* Plan Details Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left Section - Plan Details */}
                      <div className="md:col-span-2">
                        <Card className="h-full">
                          <CardContent className="p-6">
                            <div className="space-y-6">
                              <div>
                                <div className="text-sm text-gray-500 mb-1">Current Plan</div>
                                <div className="flex items-center gap-3">
                                  <h2 className="text-2xl font-semibold">
                                    {billingSettings?.plan_name || "Advanced Plan"}
                                  </h2>
                                  {billingSettings?.trial_end_date && (
                                    <Badge className="bg-yellow-400 hover:bg-yellow-500 text-yellow-800 font-bold">
                                      FREE TRIAL
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div>
                                <div className="text-sm text-gray-500 mb-1">Current Period</div>
                                <p>
                                  {billingSettings?.trial_end_date ? 
                                    `${formatDate(new Date(new Date().setDate(new Date().getDate() - 14)).toISOString())} - ${formatDate(billingSettings.trial_end_date)}` : 
                                    "Apr 22, 2025 - May 6, 2025"}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-200 pb-6">
                                <div>
                                  <div className="text-sm text-gray-500 mb-1">Plan Cost</div>
                                  <div className="flex items-end gap-2">
                                    <span className="text-3xl font-semibold">
                                      {billingSettings ? formatCurrency(billingSettings.plan_price) : "$49"}
                                    </span>
                                    <span className="text-gray-500">/ {billingSettings?.plan_interval || "month"}</span>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    $3 / month per every additional resource
                                  </div>
                                </div>

                                <div>
                                  <div className="text-sm text-gray-500 mb-1">Plan Features</div>
                                  <ul>
                                    <li>{billingSettings?.resource_quota || 50} resources included</li>
                                    <li>{billingSettings?.user_quota || 25} user seats</li>
                                  </ul>
                                </div>
                              </div>

                              <div>
                                <div className="text-sm text-gray-500 mb-3">Plan Usage</div>

                                <div className="space-y-3">
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span>Resources</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-gray-500">
                                          {billingSettings?.current_resource_count || 113}
                                        </span>
                                        {billingSettings?.resource_quota && (
                                          <>
                                            <span className="text-gray-400">/</span>
                                            <span className="text-gray-500">{billingSettings.resource_quota}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                      <div 
                                        className={`${billingSettings?.current_resource_count && billingSettings?.resource_quota && billingSettings?.current_resource_count > billingSettings?.resource_quota ? 'bg-yellow-400' : 'bg-blue-500'} h-2.5 rounded-full`} 
                                        style={{ 
                                          width: `${billingSettings?.current_resource_count && billingSettings?.resource_quota ? 
                                            Math.min(100, (billingSettings.current_resource_count / billingSettings.resource_quota) * 100) : 100}%` 
                                        }}
                                      ></div>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span>User Seats</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-gray-500">
                                          {billingSettings?.current_user_count || 3}
                                        </span>
                                        <span className="text-gray-400">/</span>
                                        <span className="text-gray-500">
                                          {billingSettings?.user_quota || 22}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                      <div 
                                        className="bg-blue-500 h-2.5 rounded-full" 
                                        style={{ 
                                          width: `${billingSettings?.current_user_count && billingSettings?.user_quota ? 
                                            Math.min(100, (billingSettings.current_user_count / billingSettings.user_quota) * 100) : 14}%` 
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <Button className="bg-blue-500 hover:bg-blue-600">
                                  Upgrade
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Right Section - Saved Cards */}
                      <div>
                        <Card className="h-full">
                          <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Saved Cards</h3>
                            <div className="flex justify-end mb-4">
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                                alt="Powered by Stripe"
                                className="h-6"
                              />
                            </div>
                            {billingSettings?.payment_methods && billingSettings.payment_methods.length > 0 ? (
                              <div className="space-y-3">
                                {billingSettings.payment_methods.map((method) => (
                                  <div key={method.id} className="border border-gray-200 rounded p-3 flex justify-between items-center">
                                    <div className="flex items-center">
                                      <CreditCard className="mr-2 text-gray-400" size={20} />
                                      <div>
                                        <div className="font-medium">{method.brand} •••• {method.last4}</div>
                                        <div className="text-xs text-gray-500">
                                          Expires {method.expiry_month}/{method.expiry_year}
                                        </div>
                                      </div>
                                    </div>
                                    {method.is_default && (
                                      <Badge className="bg-green-100 text-green-800 font-normal">Default</Badge>
                                    )}
                                  </div>
                                ))}
                                <Button className="w-full bg-white border border-gray-200 text-blue-600 hover:bg-gray-50">
                                  <Plus className="mr-1" size={16} />
                                  Add new card
                                </Button>
                              </div>
                            ) : (
                              <div className="h-64 flex flex-col items-center justify-center text-center">
                                <img
                                  src="/lovable-uploads/303f1427-5543-4ba4-9e84-bf9bf479494a.png"
                                  alt="Empty card state"
                                  className="w-48 h-auto mb-4"
                                  onError={(e) => { e.currentTarget.src = "/placeholder.svg" }}
                                />
                                <p className="text-gray-600 mb-4">You have no cards added.</p>
                                <Button className="bg-blue-500 hover:bg-blue-600">
                                  <Plus className="mr-1" size={16} />
                                  Add card
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Invoices Card */}
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Invoices</h3>
                        <div className="overflow-x-auto">
                          {invoices.length > 0 ? (
                            <table className="w-full text-sm text-left">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="pb-3 font-medium text-gray-600">Date</th>
                                  <th className="pb-3 font-medium text-right text-gray-600">Amount</th>
                                  <th className="pb-3 font-medium text-right text-gray-600">State</th>
                                  <th className="pb-3 font-medium text-right text-gray-600">Invoice Number</th>
                                  <th className="pb-3 font-medium text-right text-gray-600"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {invoices.map((invoice) => (
                                  <tr key={invoice.id}>
                                    <td className="py-3">
                                      <div>{formatDate(invoice.date)}</div>
                                      <div className="text-xs text-gray-500">{formatTime(invoice.date)}</div>
                                    </td>
                                    <td className="py-3 text-right">{formatCurrency(invoice.amount, invoice.currency)}</td>
                                    <td className="py-3 text-right">
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {invoice.status.toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="py-3 text-right">{invoice.invoice_number}</td>
                                    <td className="py-3 text-right">
                                      {invoice.pdf_url && (
                                        <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700" onClick={() => window.open(invoice.pdf_url, '_blank')}>
                                          <Download size={16} className="mr-1" />
                                          <span>Download PDF</span>
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-center py-8 text-gray-500">No invoices found</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* Account tab content */}
              <TabsContent value="account" className="space-y-6">
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="animate-spin mr-2" size={20} />
                    <span>Loading account information...</span>
                  </div>
                ) : (
                  <>
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-6">Account Details</h3>

                        <div className="space-y-6">
                          {/* Account ID */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Account ID
                            </label>
                            <div className="flex">
                              <Input
                                value={accountId}
                                readOnly
                                className="rounded-r-none bg-white"
                              />
                              <Button
                                onClick={() => copyToClipboard(accountId)}
                                className="rounded-l-none border border-l-0 border-gray-200 bg-white hover:bg-gray-50 text-blue-600"
                              >
                                <Copy size={16} className="mr-1" />
                                <span>Copy</span>
                              </Button>
                            </div>
                          </div>

                          {/* Company Name */}
                          <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                              Company Name
                            </label>
                            <Input
                              id="companyName"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              className="bg-white"
                            />
                          </div>
                          
                          {/* Save button and Change Password button */}
                          <div className="pt-4 flex space-x-3">
                            <Button
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              onClick={handleSaveAccount}
                              disabled={savingAccount}
                            >
                              {savingAccount ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="mr-2 h-4 w-4" />
                              )}
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowChangePassword(true)}
                              className="border-gray-300"
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Change Password
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Danger Zone</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Once you delete the account, there is no going back. Please be certain.
                        </p>
                        <Button
                          variant="outline"
                          className="bg-white hover:bg-red-50 border-red-300 text-red-600 hover:text-red-700"
                          onClick={handleDeleteAccount}
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete account
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* Single Sign-On tab content */}
              <TabsContent value="singleSignOn">
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="animate-spin mr-2" size={20} />
                    <span>Loading SSO information...</span>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Single Sign-On Settings</h3>
                      {ssoSettings ? (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="sso-enabled"
                              checked={ssoSettings.enabled}
                              disabled={true}
                            />
                            <label htmlFor="sso-enabled" className="text-sm font-medium">
                              Enable Single Sign-On
                            </label>
                          </div>
                          
                          {ssoSettings.enabled && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  SSO Provider
                                </label>
                                <div className="bg-gray-100 p-2 rounded">
                                  {ssoSettings.provider || 'Custom'}
                                </div>
                              </div>
                              
                              {ssoSettings.domains && ssoSettings.domains.length > 0 && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Allowed Domains
                                  </label>
                                  <div className="bg-gray-100 p-2 rounded">
                                    {ssoSettings.domains.join(', ')}
                                  </div>
                                </div>
                              )}
                              
                              <p className="text-sm text-gray-500">
                                Contact support to update your SSO configuration.
                              </p>
                            </>
                          )}
                        </div>
                      ) : (
                        <Alert className="bg-gray-100 border-none">
                          <AlertDescription>
                            Single Sign-On is not configured for your organization. Contact support to enable SSO.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Notifications tab content */}
              <TabsContent value="notifications">
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="animate-spin mr-2" size={20} />
                    <span>Loading notification settings...</span>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-2">Notifications</h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Customize how and when you receive notifications.
                      </p>

                      <div className="space-y-6 max-w-2xl">
                        {/* Time zone section */}
                        <div className="space-y-2">
                          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                            Time zone
                          </label>
                          <Select value={timeZone} onValueChange={setTimeZone}>
                            <SelectTrigger className="w-full bg-white">
                              <SelectValue placeholder="Select a timezone" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="(GMT +00:00) UTC">(GMT +00:00) UTC</SelectItem>
                              <SelectItem value="(GMT -05:00) Eastern Time">(GMT -05:00) Eastern Time</SelectItem>
                              <SelectItem value="(GMT -06:00) Central Time">(GMT -06:00) Central Time</SelectItem>
                              <SelectItem value="(GMT -07:00) Mountain Time">(GMT -07:00) Mountain Time</SelectItem>
                              <SelectItem value="(GMT -08:00) Pacific Time">(GMT -08:00) Pacific Time</SelectItem>
                              <SelectItem value="(GMT +01:00) Central European Time">(GMT +01:00) Central European Time</SelectItem>
                              <SelectItem value="(GMT +08:00) China Standard Time">(GMT +08:00) China Standard Time</SelectItem>
                              <SelectItem value="(GMT +09:00) Japan Standard Time">(GMT +09:00) Japan Standard Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="border-t border-gray-200 my-6"></div>

                        {/* Enable notification emails */}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="enable-notifications"
                            checked={enableEmails}
                            onCheckedChange={(checked) => setEnableEmails(checked as boolean)}
                          />
                          <label htmlFor="enable-notifications" className="text-sm font-medium">
                            Enable notification emails
                          </label>
                        </div>

                        {/* Time range section */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label htmlFor="from-time" className="block text-sm font-medium text-gray-700 mb-1">
                              From
                            </label>
                            <Select value={fromTime} onValueChange={setFromTime}>
                              <SelectTrigger id="from-time" className="bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }).map((_, i) => {
                                  const hour = i % 12 || 12;
                                  const period = i < 12 ? "AM" : "PM";
                                  const timeString = `${hour}:00 ${period}`;
                                  return <SelectItem key={timeString} value={timeString}>{timeString}</SelectItem>;
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label htmlFor="to-time" className="block text-sm font-medium text-gray-700 mb-1">
                              To
                            </label>
                            <Select value={toTime} onValueChange={setToTime}>
                              <SelectTrigger id="to-time" className="bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }).map((_, i) => {
                                  const hour = i % 12 || 12;
                                  const period = i < 12 ? "AM" : "PM";
                                  const timeString = `${hour}:00 ${period}`;
                                  return <SelectItem key={timeString} value={timeString}>{timeString}</SelectItem>;
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Notification description */}
                        <p className="text-xs text-gray-500 mt-2">
                          You'll receive notifications on {notificationSettings?.notification_channels?.find(c => c.channel_type === 'email')?.enabled ? 
                            usersApi && 'user email' || 'your email' : 'user@example.com'} {enableEmails ? 
                            `from ${fromTime} to ${toTime}` : 'when enabled'}. Change the time window above to select the preferred time.
                        </p>

                        {/* Save button */}
                        <div className="pt-4">
                          <Button
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={handleSaveNotifications}
                            disabled={savingNotifications}
                          >
                            {savingNotifications ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Save
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;