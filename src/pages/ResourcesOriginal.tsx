import React, { useState, useMemo } from 'react';
import { Home, PlusCircle, X, Filter, RotateCcw, ChevronRight, Loader2, Play, Square, AlertCircle, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Resource, CloudAccount } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useOrganizations } from '@/hooks/queries/use-organizations';
import { useCloudAccounts } from '@/hooks/queries/use-cloud-accounts';
import { useResources, useStartResource, useStopResource } from '@/hooks/queries/use-resources';
import { awsApi } from '@/lib/api/aws';
import { useQuery } from '@tanstack/react-query';
import { resourcesApi } from '@/lib/api/resources';

const Resources = () => {
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);

  // Date range for filtering resources by creation date - Set to wide range to show all resources by default
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return {
      startDate: oneYearAgo,
      endDate: now
    };
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch user's organizations
  const { data: organizations, isLoading: organizationsLoading, error: organizationsError } = useOrganizations();
  const organization = organizations?.[0];

  // Fetch cloud accounts for the organization
  const { data: cloudAccounts, isLoading: accountsLoading, error: accountsError } = useCloudAccounts(organization?.id || null);

  // Create a combined query for all resources (manual refresh only)
  const { data: allResources = [], isLoading: resourcesLoading, error: resourcesError, refetch: refetchAllResources } = useQuery({
    queryKey: ['all-resources', cloudAccounts?.map(a => a.id)],
    queryFn: async () => {
      if (!cloudAccounts?.length) return [];
      
      const resourcePromises = cloudAccounts.map(account => 
        resourcesApi.getAll(account.id).catch(error => {
          console.warn(`Failed to fetch resources for account ${account.id}:`, error);
          return [];
        })
      );
      
      const resourceArrays = await Promise.all(resourcePromises);
      return resourceArrays.flat();
    },
    enabled: !!cloudAccounts?.length,
    staleTime: Infinity, // Keep data fresh until manually refreshed
    refetchOnWindowFocus: false, // Don't auto-refetch on window focus
    refetchOnReconnect: false, // Don't auto-refetch on reconnect
  });

  // Loading state
  const isLoading = organizationsLoading || accountsLoading || resourcesLoading;

  // Error state  
  const hasError = organizationsError || accountsError || resourcesError;

  // Resource control hooks
  const startResourceMutation = useStartResource();
  const stopResourceMutation = useStopResource();

  // Resource selection
  const toggleResourceSelection = (id: string) => {
    if (selectedResources.includes(id)) {
      setSelectedResources(selectedResources.filter(resourceId => resourceId !== id));
    } else {
      setSelectedResources([...selectedResources, id]);
    }
  };

  const toggleAllResources = () => {
    if (selectedResources.length === allResources.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(allResources.map(resource => resource.id));
    }
  };

  // Filter resources by type
  const filterByType = (type: string | null) => {
    setCurrentFilter(type);
  };

  // Reset all filters
  const resetFilters = () => {
    setCurrentFilter(null);
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    setDateRange({
      startDate: oneYearAgo,
      endDate: now
    });
  };

  // Individual resource control functions
  const handleStartResource = async (resourceId: string) => {
    try {
      await awsApi.controlResource(resourceId, 'start');
      toast({
        title: 'Resource Started',
        description: 'Resource start command sent successfully',
      });
    } catch (error) {
      console.error('Error starting resource:', error);
      toast({
        title: 'Start Failed',
        description: 'Failed to start resource',
        variant: 'destructive',
      });
    }
  };

  const handleStopResource = async (resourceId: string) => {
    try {
      await awsApi.controlResource(resourceId, 'stop');
      toast({
        title: 'Resource Stopped',
        description: 'Resource stop command sent successfully',
      });
    } catch (error) {
      console.error('Error stopping resource:', error);
      toast({
        title: 'Stop Failed',
        description: 'Failed to stop resource',
        variant: 'destructive',
      });
    }
  };

  // Bulk resource control
  const controlResources = async (action: 'start' | 'stop') => {
    if (selectedResources.length === 0) {
      toast({
        title: 'No resources selected',
        description: 'Please select at least one resource to perform this action',
      });
      return;
    }

    try {
      // Process resources sequentially to avoid overwhelming the API
      for (const resourceId of selectedResources) {
        try {
          await awsApi.controlResource(resourceId, action);
        } catch (error) {
          console.error(`Error ${action}ing resource ${resourceId}:`, error);
          toast({
            title: 'Action Failed',
            description: `Failed to ${action} resource ${resourceId}`,
            variant: 'destructive',
          });
        }
      }
      
      toast({
        title: 'Success',
        description: `${selectedResources.length} resources ${action} command sent`,
      });
      
      // Clear selection after action
      setSelectedResources([]);
      
    } catch (error) {
      console.error(`Error ${action}ing resources:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} resources`,
        variant: 'destructive',
      });
    }
  };

  // Get account name by ID
  const getAccountName = (accountId: string) => {
    const account = cloudAccounts?.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  // Get resource type counts for tabs
  const getResourceTypeCounts = () => {
    const counts: Record<string, number> = {};
    allResources.forEach(resource => {
      const type = resource.resource_type.toLowerCase();
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  };

  // Helper function to get metadata display for different resource types
  const getMetadataDisplay = (resource: Resource) => {
    const metadata = resource.metadata || {};
    switch (resource.resource_type) {
      case 'ec2_instance':
        return metadata.instance_type ? `${metadata.instance_type}` : '';
      case 'vpc':
        return metadata.cidrBlock ? `CIDR: ${metadata.cidrBlock}` : '';
      case 'subnet':
        const az = metadata.availabilityZone;
        const cidr = metadata.cidrBlock;
        return [az && `AZ: ${az}`, cidr && `CIDR: ${cidr}`].filter(Boolean).join(' • ');
      case 's3_bucket':
        const encryption = metadata.encryption;
        const versioning = metadata.versioning;
        return [encryption && `${encryption}`, versioning && 'Versioned'].filter(Boolean).join(' • ');
      case 'internet_gateway':
      case 'nat_gateway':
        return metadata.vpcId ? `VPC: ${metadata.vpcId}` : '';
      default:
        return '';
    }
  };

  const resourceTypeCounts = getResourceTypeCounts();

  // Filter resources based on current filter and date range
  const filteredResources = useMemo(() => {
    let filtered = allResources;

    // Apply date range filter
    filtered = filtered.filter(resource => {
      // Validate the created_at date
      if (!resource.created_at) {
        return true; // Include resources without dates
      }

      const resourceDate = new Date(resource.created_at);
      
      // Check if the date is valid
      if (isNaN(resourceDate.getTime())) {
        return true; // Include resources with invalid dates
      }

      const isInDateRange = resourceDate >= dateRange.startDate && resourceDate <= dateRange.endDate;
      return isInDateRange;
    });

    // Apply type filter
    if (currentFilter) {
      filtered = filtered.filter(res => {
        if (currentFilter === 'vpc') {
          // VPC filter includes vpc, subnet, internet_gateway, nat_gateway
          return ['vpc', 'subnet', 'internet_gateway', 'nat_gateway'].includes(res.resource_type.toLowerCase());
        }
        return res.resource_type.toLowerCase().includes(currentFilter.toLowerCase());
      });
    }

    return filtered;
  }, [allResources, currentFilter, dateRange]);

  return (
    <div className="flex h-screen bg-gray-50/30">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto">

          <div className="max-w-7xl mx-auto px-6 py-6">
            {/* Apple-style filter section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="bg-gray-50/50 border-gray-200 hover:bg-gray-100/50 text-gray-700 font-medium rounded-xl px-4 py-2.5 transition-all duration-200"
                    >
                      <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                      {format(dateRange.startDate, "MMM d, yyyy")} - {format(dateRange.endDate, "MMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl border-gray-200 shadow-lg" align="start">
                    <div className="p-6 space-y-6">
                      {/* Quick Preset Buttons */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Select</h3>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const endDate = new Date();
                              const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                              setDateRange({ startDate, endDate });
                            }}
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200"
                          >
                            Last 7 Days
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const endDate = new Date();
                              const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
                              setDateRange({ startDate, endDate });
                            }}
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200"
                          >
                            Last 14 Days
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const endDate = new Date();
                              const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
                              setDateRange({ startDate, endDate });
                            }}
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200"
                          >
                            Last 28 Days
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const endDate = new Date();
                              const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                              setDateRange({ startDate, endDate });
                            }}
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200"
                          >
                            Last 30 Days
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const endDate = new Date();
                              const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                              setDateRange({ startDate, endDate });
                            }}
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200"
                          >
                            Last 90 Days
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const now = new Date();
                              const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                              const endDate = new Date();
                              setDateRange({ startDate, endDate });
                            }}
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200"
                          >
                            Current Month
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const now = new Date();
                              const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                              const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                              setDateRange({ startDate, endDate });
                            }}
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200"
                          >
                            Last Month
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const now = new Date();
                              const quarter = Math.floor(now.getMonth() / 3);
                              const startDate = new Date(now.getFullYear(), quarter * 3, 1);
                              const endDate = new Date();
                              setDateRange({ startDate, endDate });
                            }}
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200"
                          >
                            Q{Math.floor(new Date().getMonth() / 3) + 1}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const now = new Date();
                              const startDate = new Date(now.getFullYear(), 0, 1);
                              const endDate = new Date();
                              setDateRange({ startDate, endDate });
                            }}
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200"
                          >
                            Current Year
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const now = new Date();
                              const startDate = new Date(now.getFullYear() - 1, 0, 1);
                              const endDate = new Date(now.getFullYear() - 1, 11, 31);
                              setDateRange({ startDate, endDate });
                            }}
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200"
                          >
                            Last Year
                          </Button>
                        </div>
                      </div>

                      {/* Side-by-side Calendars */}
                      <div className="flex gap-4">
                        <div>
                          <div className="text-sm font-medium mb-2 text-center">Start Date</div>
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.startDate}
                            onSelect={(date) => {
                              if (date) {
                                setDateRange(prev => ({ 
                                  ...prev, 
                                  startDate: date,
                                  // If start date is after end date, adjust end date
                                  endDate: date > prev.endDate ? date : prev.endDate
                                }));
                              }
                            }}
                            disabled={(date) => date > new Date()}
                            className="rounded-md border"
                            numberOfMonths={1}
                          />
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium mb-2 text-center">End Date</div>
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.endDate}
                            onSelect={(date) => {
                              if (date) {
                                setDateRange(prev => ({ 
                                  ...prev, 
                                  endDate: date,
                                  // If end date is before start date, adjust start date
                                  startDate: date < prev.startDate ? date : prev.startDate
                                }));
                              }
                            }}
                            disabled={(date) => date > new Date()}
                            className="rounded-md border"
                            numberOfMonths={1}
                          />
                        </div>
                      </div>

                      {/* Apply/Cancel Buttons */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => setShowDatePicker(false)}
                        >
                          Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const now = new Date();
                            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                            setDateRange({
                              startDate: oneYearAgo,
                              endDate: now
                            });
                            setShowDatePicker(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="flex items-center gap-3">
                  {selectedResources.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
                        onClick={() => controlResources('start')}
                        disabled={startResourceMutation.isLoading || stopResourceMutation.isLoading}
                      >
                        {startResourceMutation.isLoading ? (
                          <Loader2 size={14} className="mr-2 animate-spin" />
                        ) : (
                          <Play size={14} className="mr-2" />
                        )}
                        Start Selected
                      </Button>
                      <Button 
                        variant="outline" 
                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
                        onClick={() => controlResources('stop')}
                        disabled={startResourceMutation.isLoading || stopResourceMutation.isLoading}
                      >
                        {stopResourceMutation.isLoading ? (
                          <Loader2 size={14} className="mr-2 animate-spin" />
                        ) : (
                          <Square size={14} className="mr-2" />
                        )}
                        Stop Selected
                      </Button>
                    </div>
                  )}

                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 shadow-sm">
                    <PlusCircle size={14} className="mr-2" />
                    Add filter
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200" 
                    onClick={resetFilters}
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <Link to="/resources/discovery">
                <Button 
                  variant="outline" 
                  className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-2"
                >
                  <Search size={16} />
                  Discovery Dashboard
                </Button>
              </Link>
              </div>
            </div>

            {/* Apple-style resource type navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
              <div className="p-1.5">
                <div className="flex flex-wrap gap-1">
                  <button
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      !currentFilter 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => filterByType(null)}
                  >
                    All Resources
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      !currentFilter ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {allResources.length}
                    </span>
                  </button>
                  <button
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      currentFilter === 'ec2' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => filterByType('ec2')}
                  >
                    EC2 Instances
                    {resourceTypeCounts['ec2_instance'] > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        currentFilter === 'ec2' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {resourceTypeCounts['ec2_instance']}
                      </span>
                    )}
                  </button>
                  <button
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      currentFilter === 'ebs' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => filterByType('ebs')}
                  >
                    EBS Volumes
                    {resourceTypeCounts['ebs_volume'] > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        currentFilter === 'ebs' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {resourceTypeCounts['ebs_volume']}
                      </span>
                    )}
                  </button>
                  <button
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      currentFilter === 's3' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => filterByType('s3')}
                  >
                    S3 Buckets
                    {resourceTypeCounts['s3_bucket'] > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        currentFilter === 's3' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {resourceTypeCounts['s3_bucket']}
                      </span>
                    )}
                  </button>
                  <button
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      currentFilter === 'vpc' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => filterByType('vpc')}
                  >
                    VPC Resources
                    {((resourceTypeCounts['vpc'] || 0) + (resourceTypeCounts['subnet'] || 0) + (resourceTypeCounts['internet_gateway'] || 0) + (resourceTypeCounts['nat_gateway'] || 0)) > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        currentFilter === 'vpc' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {(resourceTypeCounts['vpc'] || 0) + (resourceTypeCounts['subnet'] || 0) + (resourceTypeCounts['internet_gateway'] || 0) + (resourceTypeCounts['nat_gateway'] || 0)}
                      </span>
                    )}
                  </button>
                  <button
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      currentFilter === 'rds' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => filterByType('rds')}
                  >
                    RDS Instances
                    {resourceTypeCounts['rds_instance'] > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        currentFilter === 'rds' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {resourceTypeCounts['rds_instance']}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Apple-style table header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex justify-between items-center">
                  <div>
                    {selectedResources.length > 0 ? (
                      <span className="text-sm font-medium text-gray-900">
                        {selectedResources.length} resource{selectedResources.length !== 1 ? 's' : ''} selected
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-white border-gray-200 hover:bg-gray-50 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200"
                      onClick={() => refetchAllResources()}
                      disabled={resourcesLoading}
                      title="Refresh resources data"
                    >
                      <RotateCcw size={14} className={resourcesLoading ? 'animate-spin text-blue-600' : 'text-gray-500'} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-white border-gray-200 hover:bg-gray-50 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200"
                    >
                      <Filter size={14} className="text-gray-500" />
                    </Button>
                  </div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100">
                    <TableHead className="w-[40px] py-4 px-6 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        checked={selectedResources.length === allResources.length && allResources.length > 0}
                        onChange={toggleAllResources}
                        disabled={isLoading || allResources.length === 0}
                      />
                    </TableHead>
                    <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Resource Name</TableHead>
                    <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Account</TableHead>
                    <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Region</TableHead>
                    <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Created</TableHead>
                    <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Team</TableHead>
                    <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Monthly Cost
                    </TableHead>
                    <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Potential Savings
                    </TableHead>
                    <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Schedule</TableHead>
                    <TableHead className="w-[30px] py-4 px-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-32 text-center py-12">
                        <div className="flex flex-col justify-center items-center gap-4">
                          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                          <span className="text-sm font-medium text-gray-600">Loading resources...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : hasError ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-32 text-center py-12">
                        <div className="flex flex-col justify-center items-center gap-4">
                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                          </div>
                          <div className="text-center">
                            <h3 className="text-sm font-medium text-gray-900 mb-1">Error loading resources</h3>
                            <p className="text-sm text-gray-500">Please try again or contact support if the issue persists.</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredResources.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-32 text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="text-center">
                            {currentFilter ? (
                              <>
                                <h3 className="text-sm font-medium text-gray-900 mb-1">No resources found</h3>
                                <p className="text-sm text-gray-500">No resources match the filter "{currentFilter}"</p>
                              </>
                            ) : (
                              <>
                                <h3 className="text-sm font-medium text-gray-900 mb-1">No AWS resources discovered yet</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                  Connect your AWS account to start discovering resources
                                </p>
                                <Link 
                                  to="/cloud-accounts" 
                                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-150"
                                >
                                  Go to Cloud Accounts
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResources.map((resource) => (
                      <TableRow key={resource.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-150">
                        <TableCell className="py-4 px-6">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                            checked={selectedResources.includes(resource.id)}
                            onChange={() => toggleResourceSelection(resource.id)}
                          />
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col">
                            <Link
                              to={`/resources/${resource.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-150"
                            >
                              {resource.resource_name || resource.resource_id_on_provider}
                            </Link>
                            <div className="text-xs text-gray-500 mt-1">
                              {resource.resource_type}
                              {getMetadataDisplay(resource) && ` • ${getMetadataDisplay(resource)}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span 
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              resource.status?.toLowerCase().includes('stop') || resource.status?.toLowerCase().includes('terminate') 
                                ? 'bg-red-100 text-red-800'
                                : resource.status?.toLowerCase().includes('running') || resource.status?.toLowerCase().includes('available')
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {resource.status || 'unknown'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-sm font-medium text-gray-900">{getAccountName(resource.cloud_account_id)}</div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="text-sm text-gray-700">{resource.region}</span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-sm text-gray-900">{formatDate(resource.created_at).date}</div>
                          <div className="text-xs text-gray-500">{formatDate(resource.created_at).time}</div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="text-sm text-gray-700">{resource.team?.name || '-'}</span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="text-sm font-medium text-gray-900">
                            {resource.metadata?.monthlyCost ? formatCurrency(resource.metadata.monthlyCost) : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="text-sm font-medium text-green-600">
                            {resource.metadata?.potentialSavings ? formatCurrency(resource.metadata.potentialSavings) : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="text-sm text-gray-700">-</span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center justify-end gap-1">
                            {/* EC2 instance controls */}
                            {resource.resource_type === 'ec2_instance' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartResource(resource.id)}
                                  disabled={resource.status?.toLowerCase().includes('running') || false}
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors duration-150"
                                  title="Start instance"
                                >
                                  <Play size={14} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStopResource(resource.id)}
                                  disabled={resource.status?.toLowerCase().includes('stop') || false}
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors duration-150"
                                  title="Stop instance"
                                >
                                  <Square size={14} />
                                </Button>
                              </>
                            )}
                            <Link to={`/resources/${resource.id}`}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-150"
                              >
                                <ChevronRight size={14} />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;