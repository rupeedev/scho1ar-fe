import React, { useState, useEffect } from 'react';
import { PlusCircle, Info, Loader2, Server, Users, Building, Database, CalendarIcon, Filter, Check, HelpCircle, RefreshCw, CloudDownload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { SmartRecommendationsGrouped } from './SmartRecommendationsGrouped';
import { costsApi, cloudAccountsApi, resourcesApi, teamsApi, usersApi, CloudHealthMetrics } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useOrganizations } from '@/hooks/queries/use-organizations';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const CloudHealthTab = () => {
  const [includeIgnored, setIncludeIgnored] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState<CloudHealthMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Date range for cost data
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date() // today
  });

  // Temporary date range for calendar selection (not applied until confirmed)
  const [tempDateRange, setTempDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: dateRange.from,
    to: dateRange.to
  });

  // Control popover open state
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Filter states
  const [activeFilters, setActiveFilters] = useState<{
    resourceType: string[];
    region: string[];
    tags: string[];
    status: string[];
    costPriority?: string[];
  }>({
    resourceType: [],
    region: [],
    tags: [],
    status: [],
    costPriority: []
  });

  // Fetch user's organizations
  const { data: organizations, isLoading: organizationsLoading } = useOrganizations();
  const organization = organizations?.[0];
  const organizationId = organization?.id;

  // Fetch cloud accounts using React Query
  const { data: cloudAccounts = [], isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: ['cloud-accounts', organizationId],
    queryFn: () => cloudAccountsApi.getAll(organizationId!),
    enabled: !!organizationId,
  });

  // Fetch all resources from all cloud accounts
  const { data: allResources = [], isLoading: resourcesLoading, refetch: refetchResources } = useQuery({
    queryKey: ['all-resources-health', cloudAccounts?.map(a => a.id), dateRange],
    queryFn: async () => {
      if (!cloudAccounts?.length) return [];
      
      const resourcePromises = cloudAccounts.map(account => 
        resourcesApi.getAll(account.id).catch(error => {
          console.warn(`Failed to fetch resources for account ${account.id}:`, error);
          return [];
        })
      );
      
      const resourceArrays = await Promise.all(resourcePromises);
      const resources = resourceArrays.flat();
      
      // Log first resource to check structure
      if (resources.length > 0) {
        console.log('Sample resource structure:', resources[0]);
      }
      
      // Filter by date range if specified
      if (dateRange.from && dateRange.to) {
        return resources.filter(resource => {
          const resourceDate = new Date(resource.created_at);
          return resourceDate >= dateRange.from! && resourceDate <= dateRange.to!;
        });
      }
      
      return resources;
    },
    enabled: !!cloudAccounts?.length,
  });

  // Fetch teams data
  const { data: teams = [], isLoading: teamsLoading, refetch: refetchTeams } = useQuery({
    queryKey: ['teams', organizationId],
    queryFn: () => teamsApi.getAll(organizationId!),
    enabled: !!organizationId,
  });

  // Fetch users data
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['organization-users', organizationId],
    queryFn: () => usersApi.getOrganizationUsers(organizationId!),
    enabled: !!organizationId,
  });

  // Fetch health metrics
  const fetchHealthMetrics = async () => {
    if (!organizationId) return;
    
    try {
      const healthData = await costsApi.getCloudHealth(organizationId);
      setHealthMetrics(healthData);
    } catch (error) {
      console.error('Error fetching health metrics:', error);
    }
  };

  useEffect(() => {
    fetchHealthMetrics();
  }, [organizationId]);

  // Refresh all data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchAccounts(),
        refetchResources(),
        refetchTeams(),
        refetchUsers(),
        fetchHealthMetrics()
      ]);
      toast({
        title: "Data refreshed",
        description: "All statistics have been updated with the latest information",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh some data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sync resources from AWS
  const handleSyncResources = async () => {
    if (!cloudAccounts.length) {
      toast({
        title: "No cloud accounts",
        description: "Please add a cloud account first to discover resources",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      // Sync each cloud account
      const syncPromises = cloudAccounts.map(async (account) => {
        try {
          const result = await cloudAccountsApi.sync(account.id);
          return { success: true, account: account.name, result };
        } catch (error) {
          console.error(`Failed to sync ${account.name}:`, error);
          return { success: false, account: account.name, error };
        }
      });

      const results = await Promise.all(syncPromises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast({
          title: "Resource discovery initiated",
          description: `Started discovering resources from ${successCount} cloud account(s). This may take a few minutes.`,
        });
        
        // Refresh resources after a delay to show new discovered resources
        setTimeout(() => {
          refetchResources();
        }, 5000);
      }

      if (failCount > 0) {
        toast({
          title: "Some syncs failed",
          description: `Failed to sync ${failCount} cloud account(s). Check your AWS credentials.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error syncing resources:', error);
      toast({
        title: "Sync failed",
        description: "Failed to initiate resource discovery. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Apply filters to resources
  const filteredResources = React.useMemo(() => {
    let filtered = [...allResources];
    
    // Filter by resource type
    if (activeFilters.resourceType.length > 0) {
      filtered = filtered.filter(resource => {
        const resourceType = resource.resource_type?.toLowerCase() || '';
        return activeFilters.resourceType.some(type => {
          if (type === 'EC2') return resourceType.includes('instance');
          if (type === 'RDS') return resourceType.includes('db') || resourceType.includes('rds');
          if (type === 'S3') return resourceType.includes('s3') || resourceType.includes('bucket');
          return false;
        });
      });
    }
    
    // Filter by status (based on tags or other criteria)
    if (activeFilters.status.length > 0) {
      filtered = filtered.filter(resource => {
        // Simple status logic based on tags
        const hasTags = resource.tags && Object.keys(resource.tags).length > 0;
        const hasTeam = resource.team_id !== null;
        
        if (activeFilters.status.includes('healthy') && hasTags && hasTeam) return true;
        if (activeFilters.status.includes('warning') && (!hasTags || !hasTeam)) return true;
        if (activeFilters.status.includes('critical') && !hasTags && !hasTeam) return true;
        return false;
      });
    }
    
    return filtered;
  }, [allResources, activeFilters]);

  // Calculate statistics from filtered data
  const resourceCount = filteredResources.length;
  const accountCount = cloudAccounts.length;
  const teamCount = teams.length;
  const userCount = usersData?.data?.length || usersData?.total || 0;
  
  // Count untagged resources from filtered set
  const untaggedResourcesCount = filteredResources.filter(
    resource => !resource.tags || 
    (typeof resource.tags === 'object' && Object.keys(resource.tags as any).length === 0)
  ).length;
  
  // Count unscheduled resources (resources without schedule_id)
  // Currently most resources don't have schedules, so we'll show this as an opportunity
  const unscheduledResourcesCount = filteredResources.filter(
    resource => !resource.schedule_id
  ).length;
  
  // Count unassigned resources (resources without team_id)
  // Currently most resources don't have teams, so we'll show this as an opportunity
  const unassignedResourcesCount = filteredResources.filter(
    resource => !resource.team_id
  ).length;
  
  // Calculate percentages
  const taggedResourcesPercentage = resourceCount > 0 
    ? Math.round(((resourceCount - untaggedResourcesCount) / resourceCount) * 100) 
    : 0;
    
  const scheduledResourcesPercentage = resourceCount > 0 
    ? Math.round(((resourceCount - unscheduledResourcesCount) / resourceCount) * 100)
    : 0;
    
  const assignedResourcesPercentage = resourceCount > 0
    ? Math.round(((resourceCount - unassignedResourcesCount) / resourceCount) * 100)
    : 0;
    
  // Calculate health score based on metrics
  const healthScore = React.useMemo(() => {
    // If no resources, health is N/A (we'll show 0)
    if (resourceCount === 0) return 0;
    
    // Calculate weighted health score based on best practices
    // Tagged resources are important for cost tracking (30% weight)
    const taggedScore = taggedResourcesPercentage * 0.30;
    // Scheduled resources help with cost optimization (35% weight)
    const scheduledScore = scheduledResourcesPercentage * 0.35;
    // Assigned resources ensure accountability (35% weight)
    const assignedScore = assignedResourcesPercentage * 0.35;
    
    const totalScore = Math.round(taggedScore + scheduledScore + assignedScore);
    
    // Ensure we have a minimum score if there are any resources
    return totalScore;
  }, [taggedResourcesPercentage, scheduledResourcesPercentage, assignedResourcesPercentage, resourceCount]);

  // Loading states
  const loading = organizationsLoading || accountsLoading || resourcesLoading || teamsLoading || usersLoading;

  return (
    <div className="p-6">
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mr-2" />
          <span className="text-gray-600">Loading health metrics...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header with Sync and Refresh Buttons */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Cloud Health Dashboard</h1>
            <div className="flex items-center gap-3">
              {resourceCount === 0 && (
                <Button 
                  onClick={handleSyncResources}
                  disabled={isSyncing}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  <CloudDownload className={`h-4 w-4 ${isSyncing ? 'animate-pulse' : ''}`} />
                  <span>{isSyncing ? 'Discovering...' : 'Discover Resources'}</span>
                </Button>
              )}
              <Button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="flex items-center gap-2 border-gray-200 rounded-xl hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-transparent w-2/5"></div>
              <CardContent className="relative p-6 z-10">
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">RESOURCES</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {resourcesLoading ? (
                      <span className="text-sm">Loading...</span>
                    ) : (
                      resourceCount.toLocaleString()
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total discovered resources
                  </p>
                </div>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-200/20"></div>
            </Card>

            <Card className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-transparent w-2/5"></div>
              <CardContent className="relative p-6 z-10">
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">ACCOUNTS</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {accountsLoading ? (
                      <span className="text-sm">Loading...</span>
                    ) : (
                      accountCount
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    Connected cloud accounts
                  </p>
                </div>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-200/20"></div>
            </Card>

            <Card className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-transparent w-2/5"></div>
              <CardContent className="relative p-6 z-10">
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">TEAMS</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {teamsLoading ? (
                      <span className="text-sm">Loading...</span>
                    ) : (
                      teamCount
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    Active teams
                  </p>
                </div>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-200/20"></div>
            </Card>

            <Card className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-transparent w-2/5"></div>
              <CardContent className="relative p-6 z-10">
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">USERS</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {usersLoading ? (
                      <span className="text-sm">Loading...</span>
                    ) : (
                      userCount
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    Team members
                  </p>
                </div>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-200/20"></div>
            </Card>
          </div>

          {/* Health metrics section */}
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <span>Cloud Health</span>
                    <Info className="h-5 w-5 text-gray-500" />
                  </h2>
                  {(Object.values(activeFilters).flat().length > 0 || (dateRange.from && dateRange.to)) && (
                    <p className="text-sm text-gray-500 mt-1">
                      Showing filtered results 
                      {dateRange.from && dateRange.to && (
                        <span className="ml-1">
                          from {format(dateRange.from, "MMM dd")} to {format(dateRange.to, "MMM dd")}
                        </span>
                      )}
                      {Object.values(activeFilters).flat().length > 0 && (
                        <span className="ml-1">
                          ({Object.values(activeFilters).flat().length} filter{Object.values(activeFilters).flat().length > 1 ? 's' : ''} applied)
                        </span>
                      )}
                    </p>
                  )}
                </div>
                {/* Date range and filter section */}
                <div className="flex items-center gap-3">
                  {/* Date Range Picker */}
                  <Popover 
                    open={calendarOpen} 
                    onOpenChange={(open) => {
                      if (open) {
                        // Reset temp date range to current when opening
                        setTempDateRange(dateRange);
                      }
                      setCalendarOpen(open);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal border-gray-200 rounded-xl",
                          !dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, yyyy")} -{" "}
                              {format(dateRange.to, "LLL dd, yyyy")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, yyyy")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <div className="flex flex-col">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={tempDateRange.from}
                          selected={tempDateRange}
                          onSelect={(range) => setTempDateRange(range || { from: undefined, to: undefined })}
                          numberOfMonths={2}
                        />
                        <div className="p-3 border-t">
                          {tempDateRange.from && (
                            <div className="text-sm text-gray-600 mb-3">
                              {tempDateRange.to ? (
                                <>
                                  Selected: {format(tempDateRange.from, "MMM dd, yyyy")} - {format(tempDateRange.to, "MMM dd, yyyy")}
                                </>
                              ) : (
                                <>Selecting: Start from {format(tempDateRange.from, "MMM dd, yyyy")}</>
                              )}
                            </div>
                          )}
                          <div className="flex justify-between">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setTempDateRange({ from: undefined, to: undefined });
                              }}
                              disabled={!tempDateRange.from}
                            >
                              Clear
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setTempDateRange(dateRange);
                                  setCalendarOpen(false);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (tempDateRange.from && tempDateRange.to) {
                                    setDateRange(tempDateRange);
                                    setCalendarOpen(false);
                                  }
                                }}
                                disabled={!tempDateRange.from || !tempDateRange.to}
                              >
                                Apply
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 rounded-xl px-4 py-2 transition-all duration-200">
                        <Filter className="h-4 w-4" />
                        <span className="text-sm font-medium">Add filter</span>
                        {Object.values(activeFilters).flat().length > 0 && (
                          <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                            {Object.values(activeFilters).flat().length}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuLabel className="text-xs text-gray-500">Resource Type</DropdownMenuLabel>
                      <DropdownMenuCheckboxItem
                        checked={activeFilters.resourceType.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setActiveFilters(prev => ({
                              ...prev,
                              resourceType: []
                            }));
                          }
                        }}
                      >
                        <span className="font-medium">All Resources</span>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuCheckboxItem
                        checked={activeFilters.resourceType.includes('EC2')}
                        onCheckedChange={(checked) => {
                          setActiveFilters(prev => ({
                            ...prev,
                            resourceType: checked 
                              ? [...prev.resourceType, 'EC2']
                              : prev.resourceType.filter(t => t !== 'EC2')
                          }));
                        }}
                      >
                        EC2 Instances
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={activeFilters.resourceType.includes('RDS')}
                        onCheckedChange={(checked) => {
                          setActiveFilters(prev => ({
                            ...prev,
                            resourceType: checked 
                              ? [...prev.resourceType, 'RDS']
                              : prev.resourceType.filter(t => t !== 'RDS')
                          }));
                        }}
                      >
                        RDS Databases
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={activeFilters.resourceType.includes('EBS')}
                        onCheckedChange={(checked) => {
                          setActiveFilters(prev => ({
                            ...prev,
                            resourceType: checked 
                              ? [...prev.resourceType, 'EBS']
                              : prev.resourceType.filter(t => t !== 'EBS')
                          }));
                        }}
                      >
                        EBS Volumes
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={activeFilters.resourceType.includes('S3')}
                        onCheckedChange={(checked) => {
                          setActiveFilters(prev => ({
                            ...prev,
                            resourceType: checked 
                              ? [...prev.resourceType, 'S3']
                              : prev.resourceType.filter(t => t !== 'S3')
                          }));
                        }}
                      >
                        S3 Buckets
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={activeFilters.resourceType.includes('Lambda')}
                        onCheckedChange={(checked) => {
                          setActiveFilters(prev => ({
                            ...prev,
                            resourceType: checked 
                              ? [...prev.resourceType, 'Lambda']
                              : prev.resourceType.filter(t => t !== 'Lambda')
                          }));
                        }}
                      >
                        Lambda Functions
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={activeFilters.resourceType.includes('ELB')}
                        onCheckedChange={(checked) => {
                          setActiveFilters(prev => ({
                            ...prev,
                            resourceType: checked 
                              ? [...prev.resourceType, 'ELB']
                              : prev.resourceType.filter(t => t !== 'ELB')
                          }));
                        }}
                      >
                        Load Balancers
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={activeFilters.resourceType.includes('NAT')}
                        onCheckedChange={(checked) => {
                          setActiveFilters(prev => ({
                            ...prev,
                            resourceType: checked 
                              ? [...prev.resourceType, 'NAT']
                              : prev.resourceType.filter(t => t !== 'NAT')
                          }));
                        }}
                      >
                        NAT Gateways
                      </DropdownMenuCheckboxItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-gray-500">Cost Priority</DropdownMenuLabel>
                      <DropdownMenuCheckboxItem
                        checked={activeFilters.costPriority?.includes('high')}
                        onCheckedChange={(checked) => {
                          setActiveFilters(prev => ({
                            ...prev,
                            costPriority: checked 
                              ? [...(prev.costPriority || []), 'high']
                              : (prev.costPriority || []).filter(p => p !== 'high')
                          }));
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          High Cost (&gt;$100/mo)
                        </span>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={activeFilters.costPriority?.includes('medium')}
                        onCheckedChange={(checked) => {
                          setActiveFilters(prev => ({
                            ...prev,
                            costPriority: checked 
                              ? [...(prev.costPriority || []), 'medium']
                              : (prev.costPriority || []).filter(p => p !== 'medium')
                          }));
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                          Medium Cost ($20-100/mo)
                        </span>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={activeFilters.costPriority?.includes('low')}
                        onCheckedChange={(checked) => {
                          setActiveFilters(prev => ({
                            ...prev,
                            costPriority: checked 
                              ? [...(prev.costPriority || []), 'low']
                              : (prev.costPriority || []).filter(p => p !== 'low')
                          }));
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Low Cost (&lt;$20/mo)
                        </span>
                      </DropdownMenuCheckboxItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-gray-500">Status</DropdownMenuLabel>
                      <DropdownMenuCheckboxItem
                        checked={activeFilters.status.includes('healthy')}
                        onCheckedChange={(checked) => {
                          setActiveFilters(prev => ({
                            ...prev,
                            status: checked 
                              ? [...prev.status, 'healthy']
                              : prev.status.filter(s => s !== 'healthy')
                          }));
                        }}
                      >
                        Healthy
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={activeFilters.status.includes('warning')}
                        onCheckedChange={(checked) => {
                          setActiveFilters(prev => ({
                            ...prev,
                            status: checked 
                              ? [...prev.status, 'warning']
                              : prev.status.filter(s => s !== 'warning')
                          }));
                        }}
                      >
                        Warning
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={activeFilters.status.includes('critical')}
                        onCheckedChange={(checked) => {
                          setActiveFilters(prev => ({
                            ...prev,
                            status: checked 
                              ? [...prev.status, 'critical']
                              : prev.status.filter(s => s !== 'critical')
                          }));
                        }}
                      >
                        Critical
                      </DropdownMenuCheckboxItem>
                      
                      {Object.values(activeFilters).flat().length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setActiveFilters({
                              resourceType: [],
                              region: [],
                              tags: [],
                              status: [],
                              costPriority: []
                            })}
                            className="text-red-600"
                          >
                            Clear all filters
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Health score circle */}
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-3">
                    <div className="w-full h-full rounded-full border-[16px] border-gray-100"></div>
                    {resourceCount > 0 ? (
                      <>
                        <div 
                          className={`absolute top-0 left-0 w-full h-full rounded-full border-[16px] border-transparent ${
                            healthScore === 0 ? 'border-t-gray-300' :
                            healthScore < 30 ? 'border-t-red-500' : 
                            healthScore < 60 ? 'border-t-yellow-500' : 
                            'border-t-green-500'
                          }`}
                          style={{ 
                            transform: `rotate(${healthScore * 3.6}deg)` 
                          }}
                        ></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                          <div className="text-2xl font-semibold text-gray-900">{healthScore}%</div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-lg font-medium text-gray-400">N/A</div>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm text-gray-900 flex items-center justify-center gap-1">
                      Cloud Health Score
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Overall health based on:</p>
                          <p>• 30% Tagged resources</p>
                          <p>• 35% Scheduled resources</p>
                          <p>• 35% Team-assigned resources</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {resourceCount > 0 ? (
                      <span className={`text-xs ${
                        healthScore < 30 ? 'text-red-600' : 
                        healthScore < 60 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {healthScore < 30 ? 'Needs Attention' : 
                         healthScore < 60 ? 'Fair' : 
                         'Good'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">No resources in range</span>
                    )}
                  </div>
                </div>

                {/* Resources scheduled circle */}
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-3">
                    <div className="w-full h-full rounded-full border-[16px] border-gray-100"></div>
                    <div 
                      className="absolute top-0 left-0 w-full h-full rounded-full border-[16px] border-transparent border-t-blue-500" 
                      style={{ 
                        transform: `rotate(${scheduledResourcesPercentage * 3.6}deg)` 
                      }}
                    ></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-2xl font-semibold text-gray-900">{scheduledResourcesPercentage}%</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm text-gray-900 flex items-center justify-center gap-1">
                      Resources scheduled
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Resources with cost-saving schedules</p>
                          <p>to automatically stop/start based on</p>
                          <p>usage patterns</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {resourceCount - unscheduledResourcesCount} of {resourceCount}
                    </div>
                  </div>
                </div>

                {/* Resources assigned circle */}
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-3">
                    <div className="w-full h-full rounded-full border-[16px] border-gray-100"></div>
                    <div 
                      className="absolute top-0 left-0 w-full h-full rounded-full border-[16px] border-transparent border-t-blue-500" 
                      style={{ 
                        transform: `rotate(${assignedResourcesPercentage * 3.6}deg)` 
                      }}
                    ></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-2xl font-semibold text-gray-900">{assignedResourcesPercentage}%</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm text-gray-900 flex items-center justify-center gap-1">
                      Resources assigned
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Resources assigned to teams</p>
                          <p>for ownership and accountability</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {resourceCount - unassignedResourcesCount} of {resourceCount}
                    </div>
                  </div>
                </div>

                {/* Tagged resources circle */}
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-3">
                    <div className="w-full h-full rounded-full border-[16px] border-gray-100"></div>
                    <div 
                      className="absolute top-0 left-0 w-full h-full rounded-full border-[16px] border-transparent border-t-green-500" 
                      style={{ 
                        transform: `rotate(${taggedResourcesPercentage * 3.6}deg)` 
                      }}
                    ></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-2xl font-semibold text-gray-900">{taggedResourcesPercentage}%</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm text-gray-900 flex items-center justify-center gap-1">
                      Tagged resources
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Resources with tags for</p>
                          <p>cost allocation and tracking</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {resourceCount - untaggedResourcesCount} of {resourceCount}
                    </div>
                  </div>
                </div>
              </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          {/* Smart Recommendations section */}
          <SmartRecommendationsGrouped
            resources={filteredResources}
            filters={activeFilters}
            includeIgnored={includeIgnored}
            onToggleIgnored={setIncludeIgnored}
          />
          
          {/* Legacy Recommendations section (hidden by default) */}
          {false && (
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <span>Recommendations</span>
                  <Info className="h-5 w-5 text-gray-500" />
                </h2>
              </div>

              <div className="mb-6 flex items-center">
                <div className="flex items-center gap-3">
                  <Switch 
                    id="include-ignored" 
                    checked={includeIgnored} 
                    onCheckedChange={setIncludeIgnored}
                  />
                  <label htmlFor="include-ignored" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Include ignored
                  </label>
                </div>
              </div>

              {/* Recommendation cards in grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Render recommendation cards using data from metrics */}
                {healthMetrics?.recommendations.map((recommendation, index) => (
                  <Card key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </div>
                        <h4 className="font-medium text-blue-600">{recommendation.type}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {recommendation.description}
                        {recommendation.potentialSavings && (
                          <span className="font-semibold text-gray-900"> {formatCurrency(recommendation.potentialSavings)}</span>
                        )}
                      </p>
                      <div className="mt-2">
                        <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200">
                          {recommendation.impact === 'high' ? 'High priority' : 
                           recommendation.impact === 'medium' ? 'Medium priority' : 
                           'Low priority'}
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Show dummy recommendations if no real ones are available */}
                {(!healthMetrics?.recommendations || healthMetrics.recommendations.length === 0) && (
                  <>
                    {/* Card 1 - Assign schedule */}
                    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-medium mr-3">1</div>
                          <h4 className="font-medium text-blue-600">Assign schedule</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {unscheduledResourcesCount > 0 
                            ? `${unscheduledResourcesCount} resources have no schedule. Implementing schedules could save significant costs.`
                            : 'All filtered resources have schedules assigned.'}
                        </p>
                        <div className="mt-2">
                          {unscheduledResourcesCount > 0 && (
                            <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200">
                              View {unscheduledResourcesCount} resources
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card 2 - Assign tag */}
                    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-medium mr-3">2</div>
                          <h4 className="font-medium text-blue-600">Assign tag</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {untaggedResourcesCount > 0
                            ? 'Resource tagging improves cost visibility since tags become associated with costs and savings.'
                            : 'All filtered resources have tags assigned.'}
                        </p>
                        <div className="mt-2">
                          {untaggedResourcesCount > 0 && (
                            <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200">
                              View {untaggedResourcesCount} resources
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card 3 - Assign team */}
                    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-medium mr-3">3</div>
                          <h4 className="font-medium text-blue-600">Assign team</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {unassignedResourcesCount > 0
                            ? 'Providing resource ownership information helps to identify teams responsible for resource lifecycle.'
                            : 'All filtered resources have teams assigned.'}
                        </p>
                        <div className="mt-2">
                          {unassignedResourcesCount > 0 && (
                            <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200">
                              View {unassignedResourcesCount} resources
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default CloudHealthTab;