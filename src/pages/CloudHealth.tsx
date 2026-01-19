import React, { useState, useEffect } from 'react';
import { PlusCircle, Info, Loader2, Server, Users, Building, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { costsApi, cloudAccountsApi, resourcesApi, CloudHealthMetrics } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useOrganizations } from '@/hooks/queries/use-organizations';
import { useQuery } from '@tanstack/react-query';

const CloudHealth = () => {
  const [includeIgnored, setIncludeIgnored] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState<CloudHealthMetrics | null>(null);

  // Date range for cost data
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

  // Fetch user's organizations
  const { data: organizations, isLoading: organizationsLoading } = useOrganizations();
  const organization = organizations?.[0];
  const organizationId = organization?.id;

  // Fetch cloud accounts using React Query
  const { data: cloudAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['cloud-accounts', organizationId],
    queryFn: () => cloudAccountsApi.getAll(organizationId!),
    enabled: !!organizationId,
  });

  // Fetch all resources from all cloud accounts
  const { data: allResources = [], isLoading: resourcesLoading } = useQuery({
    queryKey: ['all-resources-health', cloudAccounts?.map(a => a.id)],
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
  });

  // Fetch health metrics
  useEffect(() => {
    const fetchHealthMetrics = async () => {
      if (!organizationId) return;
      
      try {
        const healthData = await costsApi.getCloudHealth(organizationId);
        setHealthMetrics(healthData);
      } catch (error) {
        console.error('Error fetching health metrics:', error);
      }
    };
    
    fetchHealthMetrics();
  }, [organizationId]);

  // Calculate statistics from real data
  const resourceCount = allResources.length;
  const accountCount = cloudAccounts.length;
  
  // Count untagged resources
  const untaggedResourcesCount = allResources.filter(
    resource => !resource.tags || Object.keys(resource.tags).length === 0
  ).length;
  
  // For demo purposes - in real app, these would come from actual schedule/team data
  const unscheduledResourcesCount = allResources.length; // All resources are unscheduled for now
  const unassignedResourcesCount = allResources.length; // All resources are unassigned for now
  
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

  // Loading states
  const loading = organizationsLoading || accountsLoading || resourcesLoading;

  return (
    <div className="flex h-screen bg-gray-50/30">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mr-2" />
              <span className="text-gray-600">Loading health metrics...</span>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="space-y-6">

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="text-sm font-medium text-gray-900">Resources</h3>
                        <Server className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {resourcesLoading ? (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            <span className="text-sm">Loading...</span>
                          </div>
                        ) : (
                          resourceCount
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        Total discovered resources
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="text-sm font-medium text-gray-900">Accounts</h3>
                        <Database className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {accountsLoading ? (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            <span className="text-sm">Loading...</span>
                          </div>
                        ) : (
                          accountCount
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        Connected cloud accounts
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="text-sm font-medium text-gray-900">Teams</h3>
                        <Building className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {organizationsLoading ? (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            <span className="text-sm">Loading...</span>
                          </div>
                        ) : (
                          1
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        Active teams
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="text-sm font-medium text-gray-900">Users</h3>
                        <Users className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {organizationsLoading ? (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            <span className="text-sm">Loading...</span>
                          </div>
                        ) : (
                          3
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        Team members
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Date range and filter section */}
                <div className="flex items-center gap-3">
                  <div className="border border-gray-200 rounded-xl bg-white px-4 py-2 flex items-center">
                    <span className="text-sm text-gray-600">{dateRange.startDate} - {dateRange.endDate}</span>
                  </div>
                  <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-2 transition-all duration-200">
                    <PlusCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Add filter</span>
                  </Button>
                </div>

                {/* Health metrics section */}
                <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <span>Cloud Health</span>
                        <Info className="h-5 w-5 text-gray-500" />
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {/* Health score circle */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32 mb-3">
                          <div className="w-full h-full rounded-full border-[16px] border-gray-100"></div>
                          <div 
                            className="absolute top-0 left-0 w-full h-full rounded-full border-[16px] border-transparent border-t-red-500" 
                            style={{ 
                              transform: `rotate(${(healthMetrics?.healthScore || 0) * 3.6}deg)` 
                            }}
                          ></div>
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <div className="text-2xl font-semibold text-gray-900">{healthMetrics?.healthScore || 0}%</div>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className={`font-medium text-sm ${
                            (healthMetrics?.healthScore || 0) < 40 ? 'text-red-600' : 
                            (healthMetrics?.healthScore || 0) < 70 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {(healthMetrics?.healthScore || 0) < 40 ? 'Negligent' : 
                             (healthMetrics?.healthScore || 0) < 70 ? 'Needs Improvement' : 
                             'Good'}
                          </span>
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
                          <div className="font-medium text-sm text-gray-900">Resources scheduled</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {resourceCount - unscheduledResourcesCount} of {resourceCount}
                          </div>
                          <Info className="h-4 w-4 text-gray-400 mx-auto mt-2" />
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
                          <div className="font-medium text-sm text-gray-900">Resources assigned</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {resourceCount - unassignedResourcesCount} of {resourceCount}
                          </div>
                          <Info className="h-4 w-4 text-gray-400 mx-auto mt-2" />
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
                          <div className="font-medium text-sm text-gray-900">Tagged resources</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {resourceCount - untaggedResourcesCount} of {resourceCount}
                          </div>
                          <Info className="h-4 w-4 text-gray-400 mx-auto mt-2" />
                        </div>
                      </div>
                    </div>
                </CardContent>
              </Card>

                {/* Recommendations section */}
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
                                Some of your resources have no schedule. Running the resources only 10 hours per day on weekdays could save you up to <span className="font-semibold text-gray-900">$5.8K</span> monthly.
                              </p>
                              <div className="mt-2">
                                <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200">View {unscheduledResourcesCount} resources</a>
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
                                Resource tagging improves cost visibility since tags become associated with costs and savings.
                              </p>
                              <div className="mt-2">
                                <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200">View {untaggedResourcesCount} resources</a>
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
                                Providing resource ownership information helps to identify teams responsible for resource lifecycle.
                              </p>
                              <div className="mt-2">
                                <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200">View {unassignedResourcesCount} resources</a>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloudHealth;