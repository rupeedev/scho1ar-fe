import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Server, Database, Cloud, AlertCircle, CheckCircle2, Clock, TrendingUp, DollarSign, HardDrive, Cpu, Network, Layers, Container, ChevronDown, ChevronUp } from 'lucide-react';
import { ResourceIconStats, getAwsResourceIcon, formatResourceTypeName } from '@/components/ui/aws-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cloudAccountsApi, CloudAccount } from '@/lib/api/cloud-accounts';
import { resourcesApi } from '@/lib/api/resources';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useCurrentMonthCosts } from '@/hooks/queries/use-current-month-costs';

interface ResourceStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byRegion: Record<string, number>;
  metadataCost: number; // Cost from resource metadata (fallback)
  potentialSavings: number;
}

interface DiscoverySession {
  accountId: string;
  accountName: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  resourcesFound?: number;
  error?: string;
  progress?: number;
}

interface ResourceDiscoveryDashboardProps {
  organizationId: string;
}

const ResourceDiscoveryDashboard: React.FC<ResourceDiscoveryDashboardProps> = ({ organizationId }) => {
  const [discoverySessions, setDiscoverySessions] = useState<Record<string, DiscoverySession>>({});
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [showAllResources, setShowAllResources] = useState(false);
  const queryClient = useQueryClient();

  // Fetch cloud accounts
  const { data: cloudAccounts = [], isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: ['cloud-accounts', organizationId],
    queryFn: () => cloudAccountsApi.getAll(organizationId),
    enabled: !!organizationId,
  });

  // Optimized resource fetching with better caching and pagination support
  const { data: allResources = [], isLoading: resourcesLoading, refetch: refetchResources } = useQuery({
    queryKey: ['all-resources-dashboard', cloudAccounts?.map(a => a.id)],
    queryFn: async () => {
      if (!cloudAccounts?.length) return [];
      
      console.log(`Fetching resources for ${cloudAccounts.length} accounts...`);
      
      // Fetch resources in batches to avoid overwhelming the server
      const batchSize = 3;
      const batches = [];
      for (let i = 0; i < cloudAccounts.length; i += batchSize) {
        batches.push(cloudAccounts.slice(i, i + batchSize));
      }
      
      const allResourcesFlat: any[] = [];
      
      for (const batch of batches) {
        const resourcePromises = batch.map(async account => {
          try {
            // Use optimized resource fetching with minimal data
            const resources = await resourcesApi.getAll(account.id, {
              // Add any optimization filters here if supported by backend
            });
            console.log(`Fetched ${resources.length} resources for account ${account.name}`);
            return resources;
          } catch (error) {
            console.warn(`Failed to fetch resources for account ${account.id}:`, error);
            return [];
          }
        });
        
        const batchResults = await Promise.all(resourcePromises);
        allResourcesFlat.push(...batchResults.flat());
        
        // Add small delay between batches to avoid rate limiting
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Total resources loaded in dashboard: ${allResourcesFlat.length}`);
      return allResourcesFlat;
    },
    enabled: !!cloudAccounts?.length,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Fetch current month's AWS costs for all cloud accounts
  const awsAccountIds = cloudAccounts?.filter(acc => acc.provider === 'aws').map(acc => acc.id) || [];
  const { data: currentMonthCosts, isLoading: costsLoading } = useCurrentMonthCosts(
    awsAccountIds, 
    awsAccountIds.length > 0
  );

  // Fetch actual database stats using existing endpoints only
  const { data: dbStats, isLoading: statsLoading } = useQuery({
    queryKey: ['resource-stats', cloudAccounts?.map(a => a.id)],
    queryFn: async () => {
      if (!cloudAccounts?.length) return { counts: {}, aggregatedStats: { total: 0, byType: {}, byStatus: {}, byRegion: {} } };
      
      console.log('Fetching resources for all accounts to calculate stats...');
      
      // Use existing /resources endpoint that we know works
      const statsPromises = cloudAccounts.map(async account => {
        try {
          console.log(`Fetching resources for account ${account.name} (${account.id})`);
          const resources = await resourcesApi.getAll(account.id);
          console.log(`Successfully fetched ${resources.length} resources for account ${account.name}`);
          
          // Calculate stats from actual resources
          const stats = {
            total: resources.length,
            byType: {} as Record<string, number>,
            byStatus: {} as Record<string, number>,
            byRegion: {} as Record<string, number>,
          };
          
          resources.forEach(resource => {
            // Count by resource type
            const resourceType = resource.resource_type.toUpperCase();
            stats.byType[resourceType] = (stats.byType[resourceType] || 0) + 1;
            
            // Count by status
            const status = resource.status || 'unknown';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
            
            // Count by region
            const region = resource.region || 'unknown';
            stats.byRegion[region] = (stats.byRegion[region] || 0) + 1;
          });
          
          console.log(`Stats calculated for ${account.name}:`, stats);
          return { accountId: account.id, stats };
        } catch (error) {
          console.error(`Failed to fetch resources for account ${account.id}:`, error);
          return { accountId: account.id, stats: { total: 0, byType: {}, byStatus: {}, byRegion: {} } };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      const countMap: Record<string, number> = {};
      const aggregatedStats = {
        total: 0,
        byType: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        byRegion: {} as Record<string, number>,
      };
      
      statsResults.forEach(result => {
        countMap[result.accountId] = result.stats.total;
        aggregatedStats.total += result.stats.total;
        
        // Aggregate by type
        Object.entries(result.stats.byType).forEach(([type, count]) => {
          aggregatedStats.byType[type] = (aggregatedStats.byType[type] || 0) + count;
        });
        
        // Aggregate by status
        Object.entries(result.stats.byStatus).forEach(([status, count]) => {
          aggregatedStats.byStatus[status] = (aggregatedStats.byStatus[status] || 0) + count;
        });
        
        // Aggregate by region
        Object.entries(result.stats.byRegion).forEach(([region, count]) => {
          aggregatedStats.byRegion[region] = (aggregatedStats.byRegion[region] || 0) + count;
        });
      });
      
      console.log('Final aggregated stats:', { counts: countMap, aggregatedStats });
      return { counts: countMap, aggregatedStats };
    },
    enabled: !!cloudAccounts?.length,
    staleTime: 5000, // Cache for only 5 seconds to ensure fresh data
  });

  // Initialize discovery sessions
  useEffect(() => {
    const initialSessions: Record<string, DiscoverySession> = {};
    cloudAccounts.forEach(account => {
      if (!discoverySessions[account.id]) {
        initialSessions[account.id] = {
          accountId: account.id,
          accountName: account.name,
          status: 'idle',
        };
      }
    });
    
    if (Object.keys(initialSessions).length > 0) {
      setDiscoverySessions(prev => ({ ...prev, ...initialSessions }));
    }
  }, [cloudAccounts]);

  // Memoized resource statistics calculation for performance
  const resourceStats = useMemo((): ResourceStats => {
    const stats: ResourceStats = {
      total: 0,
      byType: {},
      byStatus: {},
      byRegion: {},
      metadataCost: 0,
      potentialSavings: 0,
    };

    // Calculate from real resource data
    allResources.forEach(resource => {
      stats.total++;
      
      // Count by resource type
      const resourceType = resource.resource_type.toUpperCase();
      stats.byType[resourceType] = (stats.byType[resourceType] || 0) + 1;
      
      // Count by status
      const status = resource.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      
      // Count by region
      const region = resource.region || 'unknown';
      stats.byRegion[region] = (stats.byRegion[region] || 0) + 1;
      
      // Add fallback cost data from metadata if available
      if (resource.metadata?.monthlyCost) {
        stats.metadataCost += parseFloat(resource.metadata.monthlyCost.toString());
      }
      
      if (resource.metadata?.potentialSavings) {
        stats.potentialSavings += parseFloat(resource.metadata.potentialSavings.toString());
      }
    });

    return stats;
  }, [allResources]);

  // Memoized callbacks for better performance
  const handleSyncAccount = useCallback(async (accountId: string) => {
    const account = cloudAccounts.find(acc => acc.id === accountId);
    if (!account) return;

    // Update session status
    setDiscoverySessions(prev => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        status: 'running',
        startTime: new Date(),
        progress: 0,
      }
    }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setDiscoverySessions(prev => ({
          ...prev,
          [accountId]: {
            ...prev[accountId],
            progress: Math.min((prev[accountId].progress || 0) + Math.random() * 20, 90),
          }
        }));
      }, 500);

      // Call the sync API
      const syncResult = await cloudAccountsApi.sync(accountId);
      
      clearInterval(progressInterval);

      // Update session with results
      setDiscoverySessions(prev => ({
        ...prev,
        [accountId]: {
          ...prev[accountId],
          status: 'completed',
          endTime: new Date(),
          progress: 100,
          resourcesFound: syncResult.discoveryResult?.resourceCount || 0,
        }
      }));

      // Show appropriate toast
      if (syncResult.discoveryTriggered && syncResult.discoveryResult) {
        const { resourceCount = 0, createdCount = 0, updatedCount = 0 } = syncResult.discoveryResult;
        const message = createdCount && updatedCount 
          ? `Found ${resourceCount} resources (${createdCount} new, ${updatedCount} updated)`
          : createdCount 
          ? `Found ${resourceCount} resources (${createdCount} new)`
          : updatedCount 
          ? `Found ${resourceCount} resources (${updatedCount} updated)`
          : `Found ${resourceCount} resources`;
          
        toast({
          title: 'Discovery Completed',
          description: `${message} in ${account.name}`,
        });
      }

      // Refresh accounts and resources data after a short delay
      setTimeout(async () => {
        await refetchAccounts();
        await refetchResources();
        // Also invalidate all resource-related and cost queries to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ['all-resources'] });
        queryClient.invalidateQueries({ queryKey: ['all-resources-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['resource-stats'] });
        queryClient.invalidateQueries({ queryKey: ['current-month-costs'] });
      }, 1000);

    } catch (error) {
      console.error('Sync error:', error);
      
      setDiscoverySessions(prev => ({
        ...prev,
        [accountId]: {
          ...prev[accountId],
          status: 'error',
          endTime: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }));

      toast({
        title: 'Discovery Failed',
        description: `Failed to discover resources in ${account.name}`,
        variant: 'destructive',
      });
    }
  }, [cloudAccounts, refetchAccounts, refetchResources, queryClient]);

  // Handle bulk sync
  const handleSyncAll = useCallback(async () => {
    setIsDiscovering(true);
    
    try {
      const awsAccounts = cloudAccounts.filter(acc => acc.provider === 'aws');
      
      for (const account of awsAccounts) {
        await handleSyncAccount(account.id);
        // Add small delay between accounts to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      toast({
        title: 'Bulk Discovery Completed',
        description: `Completed discovery for ${awsAccounts.length} AWS accounts`,
      });
      
      // Refresh resources after bulk sync with delay and cache invalidation
      setTimeout(async () => {
        await refetchResources();
        queryClient.invalidateQueries({ queryKey: ['all-resources'] });
        queryClient.invalidateQueries({ queryKey: ['all-resources-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['resource-stats'] });
        queryClient.invalidateQueries({ queryKey: ['current-month-costs'] });
      }, 1500);
    } catch (error) {
      toast({
        title: 'Bulk Discovery Failed',
        description: 'Some accounts failed to sync. Check individual account status.',
        variant: 'destructive',
      });
    } finally {
      setIsDiscovering(false);
    }
  }, [cloudAccounts, handleSyncAccount, refetchResources, queryClient]);

  const getStatusIcon = (status: DiscoverySession['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (account: CloudAccount, session?: DiscoverySession) => {
    if (session?.status === 'running') {
      return <Badge variant="secondary">Discovering...</Badge>;
    }
    if (session?.status === 'error') {
      return <Badge variant="destructive">Error</Badge>;
    }
    if (account.last_synced_at) {
      const syncAge = Date.now() - new Date(account.last_synced_at).getTime();
      const hoursAgo = Math.floor(syncAge / (1000 * 60 * 60));
      
      if (hoursAgo < 1) {
        return <Badge variant="default" className="bg-green-100 text-green-800">Fresh</Badge>;
      } else if (hoursAgo < 24) {
        return <Badge variant="secondary">Synced {hoursAgo}h ago</Badge>;
      } else {
        return <Badge variant="outline">Stale</Badge>;
      }
    }
    return <Badge variant="outline">Never synced</Badge>;
  };


  if (accountsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">Loading discovery dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50/40 via-emerald-50/30 to-gray-50/20">
      {/* Header Section with seamless background */}
      <div className="bg-gradient-to-b from-gray-50/60 via-emerald-50/40 to-gray-50/30 p-6 border-b border-emerald-200/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Discovery Dashboard
            </h2>
            <p className="text-gray-600 text-sm">
              Discover and monitor your AWS cloud infrastructure
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                await refetchResources();
                // Invalidate all resource and cost queries to ensure fresh data
                queryClient.invalidateQueries({ queryKey: ['all-resources'] });
                queryClient.invalidateQueries({ queryKey: ['all-resources-dashboard'] });
                queryClient.invalidateQueries({ queryKey: ['resource-stats'] });
                queryClient.invalidateQueries({ queryKey: ['current-month-costs'] });
                toast({
                  title: 'Data Refreshed',
                  description: 'Resource and cost data has been refreshed from database',
                });
              }}
              disabled={resourcesLoading || costsLoading}
              variant="outline"
              className="border-none shadow-lg transition-all duration-300 hover:scale-105 bg-white/80 hover:bg-white/90 text-emerald-600 hover:text-emerald-700 backdrop-blur-sm"
              title="Refresh resource and cost data from database"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${resourcesLoading || costsLoading ? 'animate-spin' : ''}`} />
              Refresh Database
            </Button>
            <Button
              onClick={handleSyncAll}
              disabled={isDiscovering || cloudAccounts.length === 0}
              className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:bg-gradient-to-r hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 hover:scale-105 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 shadow-lg"
              title="Sync and discover new AWS resources from cloud provider"
            >
              {isDiscovering ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <Cloud className="h-4 w-4 mr-2" />
                  Sync from AWS
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content with seamless background integration */}
      <div className="p-6">
        <div className="space-y-6">

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm rounded-2xl border border-emerald-200/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-900">Total Resources</CardTitle>
                    <Server className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-gray-900">
                      {dbStats?.aggregatedStats?.total ?? resourceStats.total}
                    </div>
                    <p className="text-xs text-gray-600">
                      {(dbStats?.aggregatedStats?.total ?? resourceStats.total) > 0 
                        ? `Across ${cloudAccounts.length} accounts` 
                        : 'No resources discovered yet'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm rounded-2xl border border-emerald-200/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-900">Monthly Cost</CardTitle>
                    <DollarSign className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-gray-900">
                      {costsLoading ? (
                        <div className="flex items-center">
                          <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                          <span className="text-sm">Loading...</span>
                        </div>
                      ) : (
                        formatCurrency(currentMonthCosts?.totalCost || resourceStats.metadataCost)
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {currentMonthCosts?.totalCost > 0 
                        ? "Current month spend from AWS" 
                        : resourceStats.metadataCost > 0
                        ? "Estimated monthly spend"
                        : "No cost data available"
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm rounded-2xl border border-emerald-200/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-900">Potential Savings</CardTitle>
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-green-600">{formatCurrency(resourceStats.potentialSavings)}</div>
                    <p className="text-xs text-gray-600">
                      Optimization opportunities
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm rounded-2xl border border-emerald-200/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-900">Sync Status</CardTitle>
                    <Cloud className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-gray-900">
                      {cloudAccounts.filter(acc => acc.last_synced_at).length}/{cloudAccounts.length}
                    </div>
                    <p className="text-xs text-gray-600">
                      Accounts synced
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Resource Type Breakdown */}
              <Card className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm rounded-2xl border border-emerald-200/20">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">Resource Distribution</CardTitle>
                </CardHeader>
                <CardContent>
          {statsLoading ? (
            <div className="flex items-center justify-center h-24">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2">Loading resources...</span>
            </div>
                  ) : (dbStats?.aggregatedStats?.byType && Object.keys(dbStats.aggregatedStats.byType).length > 0) ? (
                    <div>
                      {/* Summary info */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-600">
                          {Object.keys(dbStats.aggregatedStats.byType).length} AWS service types discovered
                        </div>
                        {Object.keys(dbStats.aggregatedStats.byType).length > 10 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAllResources(!showAllResources)}
                            className="text-xs"
                          >
                            {showAllResources ? (
                              <>Show Less <ChevronUp className="h-3 w-3 ml-1" /></>
                            ) : (
                              <>Show All <ChevronDown className="h-3 w-3 ml-1" /></>
                            )}
                          </Button>
                        )}
                      </div>
                      
                      {/* Scrollable resource grid */}
                      <div className="overflow-x-auto">
                        <div className="flex gap-8 pb-2" style={{ minWidth: 'max-content' }}>
                          {Object.entries(dbStats.aggregatedStats.byType)
                            .sort(([,a], [,b]) => b - a) // Sort by count (highest to lowest)
                            .slice(0, showAllResources ? undefined : 10) // Show 10 by default, all when expanded
                            .map(([type, count]) => (
                              <ResourceIconStats
                                key={type}
                                resourceType={type}
                                count={count}
                              />
                            ))}
                        </div>
                      </div>
                      
                      {/* Scroll hint for many services */}
                      {(showAllResources ? Object.keys(dbStats.aggregatedStats.byType).length : Math.min(10, Object.keys(dbStats.aggregatedStats.byType).length)) > 8 && (
                        <div className="text-xs text-gray-500 mt-2 text-center">
                          ← Scroll horizontally to see all services →
                        </div>
                      )}
                      
                      {/* Show count of hidden services when collapsed */}
                      {!showAllResources && Object.keys(dbStats.aggregatedStats.byType).length > 10 && (
                        <div className="text-xs text-gray-500 mt-2 text-center">
                          {Object.keys(dbStats.aggregatedStats.byType).length - 10} more service types available
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium text-gray-900">No resources discovered yet</p>
                      <p className="text-sm text-gray-600">Sync your cloud accounts to discover AWS resources</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Discovery Status */}
              <Card className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm rounded-2xl border border-emerald-200/20">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">Account Discovery Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className="border-b border-emerald-200/20 bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30 backdrop-blur-sm">
                        <TableHead className="text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Account</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Provider</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Last Sync</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Resources Found</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Progress</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cloudAccounts.map((account) => {
                        const session = discoverySessions[account.id];
                        return (
                          <TableRow key={account.id} className="border-b border-emerald-200/10 hover:bg-gradient-to-r hover:from-emerald-50/20 hover:via-gray-50/10 hover:to-emerald-50/20 transition-all duration-200 backdrop-blur-sm">
                            <TableCell className="py-4 px-6 font-medium text-gray-900">{account.name}</TableCell>
                            <TableCell className="py-4 px-6">
                              <Badge variant="outline" className="uppercase bg-gray-50 text-gray-700 border-gray-200">
                                {account.provider}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(session?.status || 'idle')}
                                {getStatusBadge(account, session)}
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              {account.last_synced_at ? (
                                <div>
                                  <div className="text-sm text-gray-900">{formatDate(account.last_synced_at).date}</div>
                                  <div className="text-xs text-gray-500">
                                    {formatDate(account.last_synced_at).time}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">Never</span>
                              )}
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              {session?.resourcesFound !== undefined ? (
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">{session.resourcesFound}</span>
                                  <span className="text-xs text-gray-500">
                                    DB: {dbStats?.counts?.[account.id] ?? (statsLoading ? '...' : '0')}
                                  </span>
                                </div>
                              ) : (() => {
                                const dbCount = dbStats?.counts?.[account.id] ?? 0;
                                return dbCount > 0 ? (
                                  <span className="font-medium text-gray-900">{dbCount}</span>
                                ) : account.last_synced_at ? (
                                  <span className="text-gray-400">-</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              {session?.status === 'running' && session.progress !== undefined ? (
                                <div className="w-full">
                                  <Progress value={session.progress} className="w-20" />
                                  <span className="text-xs text-gray-500 ml-2">
                                    {Math.round(session.progress)}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <Button
                                onClick={() => handleSyncAccount(account.id)}
                                disabled={session?.status === 'running' || account.provider !== 'aws'}
                                size="sm"
                                className="border-none shadow-sm transition-all duration-300 hover:scale-105 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white text-xs px-2 py-1 h-7 rounded-lg"
                                title={`Sync resources for ${account.name}`}
                              >
                                {session?.status === 'running' ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Cloud className="h-3 w-3 mr-1" />
                                    Sync
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
        </div>
      </div>
    </div>
  );
};

export default ResourceDiscoveryDashboard;