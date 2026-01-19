
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, RefreshCw, Pencil, Plus, Loader2, Building, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cloudAccountsApi, CloudAccount } from '@/lib/api';
import { organizationsApi } from '@/lib/api/organizations';
import { formatDate } from '@/lib/utils';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useQuery } from '@tanstack/react-query';

const CloudAccounts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [loadingSync, setLoadingSync] = useState<string | null>(null);
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null);

  // Get user's organizations with error handling
  const { data: organizations, isLoading: organizationsLoading, error: organizationsError, refetch: refetchOrganizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.getAll,
    retry: false, // Don't retry on error
    retryOnMount: false,
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnReconnect: false, // Prevent refetch on reconnect
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  const organization = organizations?.[0];

  // Get cloud accounts only if organization exists
  const { data: cloudAccounts, isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: ['cloud-accounts', organization?.id],
    queryFn: () => cloudAccountsApi.getAll(organization!.id),
    enabled: !!organization?.id,
    refetchOnWindowFocus: false, // Manual refetch only
    refetchOnReconnect: false, // Prevent refetch on reconnect
    staleTime: Infinity, // Keep data fresh until manually refreshed
  });

  useEffect(() => {
    if (cloudAccounts) {
      setAccounts(cloudAccounts);
    }
  }, [cloudAccounts]);

  // Refetch when returning from account creation or when component mounts
  useEffect(() => {
    if (organization?.id) {
      if (location.state?.fromAccountCreation) {
        // Force refetch when coming from account creation
        refetchAccounts();
      }
    }
  }, [location.state, organization?.id, refetchAccounts]);

  const handleSyncAccount = async (accountId: string) => {
    try {
      setLoadingSync(accountId);
      
      // Call the enhanced sync endpoint that includes discovery
      const syncResult = await cloudAccountsApi.sync(accountId);
      
      // Handle the response based on what happened
      if (syncResult.discoveryTriggered) {
        if (syncResult.discoveryResult) {
          // Successful discovery
          const { resourceCount = 0, createdCount = 0, updatedCount = 0 } = syncResult.discoveryResult;
          const message = createdCount && updatedCount 
            ? `Found ${resourceCount} resources (${createdCount} new, ${updatedCount} updated)`
            : createdCount 
            ? `Found ${resourceCount} resources (${createdCount} new)`
            : updatedCount 
            ? `Found ${resourceCount} resources (${updatedCount} updated)`
            : `Found ${resourceCount} resources`;
            
          toast({
            title: 'AWS Sync & Discovery Completed',
            description: message,
          });
        } else if (syncResult.discoveryError) {
          // Discovery attempted but failed
          toast({
            title: 'AWS Discovery Failed',
            description: `Sync completed but resource discovery failed: ${syncResult.discoveryError}`,
            variant: 'destructive',
          });
        } else {
          // Discovery triggered but no specific result
          toast({
            title: 'AWS Discovery Initiated',
            description: 'AWS resource discovery has been started',
          });
        }
      } else {
        // Non-AWS account or discovery not triggered
        toast({
          title: 'Account Synced',
          description: 'Account sync completed successfully',
        });
      }
      
      // Refresh the accounts list after sync
      setTimeout(() => {
        refetchAccounts();
      }, 1500);
    } catch (error: any) {
      console.error('Error syncing account:', error);
      
      // Check if this is still the 404 error for missing AWS endpoints
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        toast({
          title: 'AWS Discovery Not Available',
          description: 'AWS resource discovery endpoint not deployed yet. Only timestamp sync available.',
        });
        
        // Try the fallback sync for timestamp update
        try {
          await cloudAccountsApi.sync(accountId);
          setTimeout(() => {
            refetchAccounts();
          }, 1000);
        } catch (fallbackError) {
          console.error('Fallback sync also failed:', fallbackError);
        }
      } else {
        toast({
          title: 'Sync Error',
          description: 'Failed to sync account. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoadingSync(null);
    }
  };

  const handleDeleteAccount = async (accountId: string, accountName: string) => {
    try {
      setLoadingDelete(accountId);
      
      await cloudAccountsApi.delete(accountId);
      
      toast({
        title: 'Account Deleted',
        description: `"${accountName}" has been successfully removed.`,
      });
      
      // Refresh the accounts list after deletion
      refetchAccounts();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Delete Error',
        description: 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingDelete(null);
    }
  };

  const handleCreateOrganization = () => {
    navigate('/onboarding/organization');
  };

  const isLoading = organizationsLoading || accountsLoading;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4">

            {/* Organization Setup Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Organization Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                {organizationsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading organization...</span>
                  </div>
                ) : organizationsError ? (
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Unable to Load Organizations</p>
                        <p className="text-sm text-red-700 font-medium">Connection error occurred</p>
                        <p className="text-xs text-gray-600 mt-1">There was an error loading your organizations. You can still create one.</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button 
                        onClick={handleCreateOrganization}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Building className="h-4 w-4 mr-2" />
                        Create Organization
                      </Button>
                    </div>
                  </div>
                ) : organization ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Building className="h-4 w-4 text-gray-500" />
                          <p className="font-semibold text-gray-900">{organization.name}</p>
                        </div>
                        <p className="text-sm text-green-700 font-medium">✓ Organization configured and ready</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Created: {new Date(organization.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/onboarding/organization')}
                        className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Organization
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Setup Required</p>
                        <p className="text-sm text-orange-700 font-medium">No organization found</p>
                        <p className="text-xs text-gray-600 mt-1">Create an organization to start managing your cloud accounts</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button 
                        onClick={handleCreateOrganization}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Building className="h-4 w-4 mr-2" />
                        Create Organization
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cloud Accounts Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <span className="text-lg font-semibold">Cloud Accounts {!isLoading && organization && `(${accounts.length})`}</span>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search accounts..."
                        className="w-full sm:w-64 h-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <Button 
                      className="bg-blue-500 hover:bg-blue-600 whitespace-nowrap" 
                      onClick={() => navigate('/add-account')}
                      disabled={!organization || !!organizationsError}
                    >
                      <Plus size={16} />
                      <span>Add account</span>
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!organization && !organizationsError ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Create an organization first to start adding cloud accounts</p>
                  </div>
                ) : organizationsError ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Unable to load cloud accounts. Please create an organization first.</p>
                  </div>
                ) : (
                  <>
                    {/* Show scroll indicator if there are more than 5 accounts */}
                    {accounts.length > 5 && (
                      <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                        <span>Showing {accounts.length} accounts</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">Scroll to view more</span>
                      </div>
                    )}
                    
                    {/* Table */}
                    <div className={`border border-gray-200 rounded-md ${accounts.length > 5 ? 'max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100' : 'overflow-hidden'}`}>
                      <Table>
                        <TableHeader className={`${accounts.length > 5 ? 'sticky top-0 z-10 bg-gray-50' : ''}`}>
                          <TableRow className="bg-gray-50">
                            <TableHead className="w-64">Account Name</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Account ID</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Last Sync</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accountsLoading ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center">
                                <div className="flex justify-center items-center">
                                  <Loader2 className="h-6 w-6 text-blue-500 animate-spin mr-2" />
                                  <span>Loading accounts...</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : accounts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No cloud accounts found. Add your first account to get started.
                              </TableCell>
                            </TableRow>
                          ) : accounts
                            .filter(account => 
                              searchQuery ? account.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
                            )
                            .map((account) => (
                              <TableRow key={account.id}>
                                <TableCell className="font-medium text-blue-600 hover:underline cursor-pointer"
                                  onClick={() => navigate(`/cloud-accounts/${account.id}`)}>
                                  {account.name}
                                </TableCell>
                                <TableCell>{account.provider}</TableCell>
                                <TableCell>{account.account_id_on_provider}</TableCell>
                                <TableCell>
                                  <div>{formatDate(account.created_at).date}</div>
                                  <div className="text-xs text-gray-500">{formatDate(account.created_at).time}</div>
                                </TableCell>
                                <TableCell>
                                  <div>{account.last_synced_at ? formatDate(account.last_synced_at).date : 'Not synced'}</div>
                                  <div className="text-xs text-gray-500">{account.last_synced_at ? formatDate(account.last_synced_at).time : ''}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button 
                                            className="text-gray-500 hover:text-blue-500 disabled:opacity-50"
                                            onClick={() => handleSyncAccount(account.id)}
                                            disabled={loadingSync === account.id}
                                            aria-label="Discover AWS Resources">
                                            {loadingSync === account.id ? 
                                              <Loader2 size={16} className="animate-spin" /> : 
                                              <RefreshCw size={16} />}
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Discover AWS Resources</p>
                                          <p className="text-xs text-gray-300">Scans your AWS account for EC2 instances and EBS volumes</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <button 
                                      className="text-gray-500 hover:text-blue-500"
                                      onClick={() => navigate(`/cloud-accounts/${account.id}/edit`)}>
                                      <Pencil size={16} />
                                    </button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <button 
                                          className="text-gray-500 hover:text-red-500 disabled:opacity-50"
                                          disabled={loadingDelete === account.id}
                                          aria-label="Delete Account">
                                          {loadingDelete === account.id ? 
                                            <Loader2 size={16} className="animate-spin" /> : 
                                            <Trash2 size={16} />}
                                        </button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Cloud Account</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete "{account.name}"? This action cannot be undone and will remove all associated data including discovered resources.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteAccount(account.id, account.name)}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                          >
                                            Delete Account
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-4 text-sm text-gray-500">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-2 md:gap-6">
            <span>Terms of service</span>
            <span>Privacy Policy</span>
            <span>Contact us</span>
            <span>About</span>
            <span className="md:ml-auto">© 2021 - {new Date().getFullYear()}, Scho1ar Solution Inc. or its affiliates</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudAccounts;
