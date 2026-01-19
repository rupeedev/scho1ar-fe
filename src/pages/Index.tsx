import React, { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Info,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Home,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import SupportChat from '@/components/SupportChat';
import StatsCard from '@/components/dashboard/StatsCard';
import DateRangePicker from '@/components/dashboard/DateRangePicker';
import CostChart from '@/components/dashboard/CostChart';
import { AvocadoIcon, CO2Icon, EcoIcon } from '@/components/dashboard/CardIcons';
import { Card, CardContent } from '@/components/ui/card';
import { subDays, differenceInDays } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useClerkAuth } from '@/hooks/use-clerk-auth';
// Import React Query hooks
import { 
  useOrganizations, 
  useCostTrend, 
  useCloudHealth, 
  useOptimizationLab,
  useCloudAccounts,
  usePreviousPeriodCosts,
  useAwsCosts
} from '@/hooks/queries';

const Dashboard = () => {
  const { user, loading } = useClerkAuth();
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { toast } = useToast();

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleChatOpen = () => {
    console.log('Opening chat window');
    setIsChatOpen(true);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  // Redirect to login if not authenticated
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Get organizations using React Query
  const { 
    data: organizations,
    isLoading: isLoadingOrganizations,
    error: organizationsError
  } = useOrganizations();

  // Get the first organization ID
  const organizationId = organizations && organizations.length > 0 
    ? organizations[0].id 
    : null;

  // Calculate the date difference for previous period comparison
  const dateDifference = differenceInDays(endDate, startDate);

  // Get cost trend data using React Query
  const { 
    data: costTrendData,
    isLoading: isLoadingCostTrend,
    error: costTrendError 
  } = useCostTrend(organizationId, startDate, endDate, 'DAILY');

  // Get previous period cost data for comparison
  const {
    data: previousPeriodData,
    isLoading: isLoadingPreviousPeriod
  } = usePreviousPeriodCosts(organizationId, startDate, endDate, dateDifference);

  // Get cloud health metrics using React Query
  const { 
    data: healthMetrics,
    isLoading: isLoadingHealthMetrics,
    error: healthMetricsError 
  } = useCloudHealth(organizationId);

  // Get optimization lab data using React Query
  const { 
    data: optimizationData,
    isLoading: isLoadingOptimizationData,
    error: optimizationDataError 
  } = useOptimizationLab(organizationId);

  // Get cloud accounts using React Query
  const { 
    data: cloudAccounts,
    isLoading: isLoadingCloudAccounts,
    error: cloudAccountsError 
  } = useCloudAccounts(organizationId);

  // Get AWS costs by service for the first cloud account (if available)
  const firstCloudAccountId = cloudAccounts && cloudAccounts.length > 0 
    ? cloudAccounts[0].id 
    : null;

  // Get AWS costs by service (only if we have cloud accounts)
  const {
    data: awsCostsByService,
    isLoading: isLoadingAwsCosts,
    error: awsCostsError
  } = useAwsCosts(
    firstCloudAccountId, 
    startDate, 
    endDate, 
    'DAILY', 
    'SERVICE'
  );

  // Get AWS costs by region for geographic breakdown (only if we have cloud accounts)
  const {
    data: awsCostsByRegion,
    isLoading: isLoadingAwsCostsByRegion,
    error: awsCostsByRegionError
  } = useAwsCosts(
    firstCloudAccountId, 
    startDate, 
    endDate, 
    'DAILY', 
    'REGION'
  );

  // Calculate cost summary data
  const costSummary = useMemo(() => {
    if (!costTrendData || !previousPeriodData || !Array.isArray(costTrendData) || !Array.isArray(previousPeriodData)) {
      return {
        totalCost: 0,
        percentChange: 0,
        previousPeriodCost: 0,
        forecastedCost: 0
      };
    }

    const totalCost = costTrendData.reduce((sum, item) => sum + (item?.cost || 0), 0);
    const previousPeriodCost = previousPeriodData.reduce((sum, item) => sum + (item?.cost || 0), 0);
    const percentChange = previousPeriodCost ? ((totalCost - previousPeriodCost) / previousPeriodCost) * 100 : 0;
    const forecastedCost = totalCost * 1.1; // 10% increase as a placeholder

    return {
      totalCost,
      percentChange,
      previousPeriodCost,
      forecastedCost
    };
  }, [costTrendData, previousPeriodData]);

  // Prepare resource breakdown data from real AWS cost data
  const resourceBreakdown = useMemo(() => {
    if (!awsCostsByService && !costSummary.totalCost) return [];

    // If we have real AWS cost data and no errors, use it
    if (!awsCostsError && awsCostsByService && awsCostsByService.resultsByTime && awsCostsByService.resultsByTime.length > 0) {
      const groups = awsCostsByService.resultsByTime[0]?.groups || [];
      if (!Array.isArray(groups)) return [];
      
      const totalCost = groups.reduce((sum: number, group: any) => {
        const amount = parseFloat(group.metrics?.UnblendedCost?.amount || '0');
        return sum + amount;
      }, 0);

      return groups.map((group: any) => {
        const serviceName = group.keys[0] || 'Unknown Service';
        const cost = parseFloat(group.metrics?.UnblendedCost?.amount || '0');
        const percentage = totalCost > 0 ? (cost / totalCost) * 100 : 0;
        
        return {
          name: serviceName,
          value: Math.round(percentage),
          cost: cost
        };
      }).filter((item: any) => item.cost > 0).slice(0, 5); // Top 5 services
    }

    // Fallback to mock data if no real data available
    if (!costSummary.totalCost) return [];
    return [
      { name: 'Service/EKS', value: 31, cost: costSummary.totalCost * 0.31 },
      { name: 'Service/ECS', value: 27, cost: costSummary.totalCost * 0.27 },
      { name: 'Service/EC2', value: 15, cost: costSummary.totalCost * 0.15 },
      { name: 'Service/RDS', value: 15, cost: costSummary.totalCost * 0.15 },
      { name: 'Other', value: 12, cost: costSummary.totalCost * 0.12 }
    ];
  }, [awsCostsByService, awsCostsError, costSummary.totalCost]);

  // Prepare region breakdown data from real AWS cost data
  const regionBreakdown = useMemo(() => {
    if (!awsCostsByRegion && !costSummary.totalCost) return [];

    // If we have real AWS cost data by region and no errors, use it
    if (!awsCostsByRegionError && awsCostsByRegion && awsCostsByRegion.resultsByTime && awsCostsByRegion.resultsByTime.length > 0) {
      const groups = awsCostsByRegion.resultsByTime[0]?.groups || [];
      if (!Array.isArray(groups)) return [];
      
      const totalCost = groups.reduce((sum: number, group: any) => {
        const amount = parseFloat(group.metrics?.UnblendedCost?.amount || '0');
        return sum + amount;
      }, 0);

      return groups.map((group: any) => {
        const regionName = group.keys[0] || 'Unknown Region';
        const cost = parseFloat(group.metrics?.UnblendedCost?.amount || '0');
        const percentage = totalCost > 0 ? (cost / totalCost) * 100 : 0;
        
        return {
          name: regionName,
          value: Math.round(percentage),
          cost: cost
        };
      }).filter((item: any) => item.cost > 0).slice(0, 5); // Top 5 regions
    }

    // Fallback to mock data if no real data available
    if (!costSummary.totalCost) return [];
    return [
      { name: 'us-east-1', value: 75, cost: costSummary.totalCost * 0.75 },
      { name: 'us-west-2', value: 20, cost: costSummary.totalCost * 0.20 },
      { name: 'eu-west-1', value: 5, cost: costSummary.totalCost * 0.05 }
    ];
  }, [awsCostsByRegion, awsCostsByRegionError, costSummary.totalCost]);

  // Prepare account breakdown data
  const accountBreakdown = useMemo(() => {
    if (!costSummary.totalCost || !cloudAccounts || !Array.isArray(cloudAccounts) || cloudAccounts.length === 0) return [];

    return [
      { name: cloudAccounts[0].name, value: 100, cost: costSummary.totalCost }
    ];
  }, [costSummary.totalCost, cloudAccounts]);

  // Format number as USD
  const formatCurrency = (value: number): string => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  // Format CO2 amount
  const formatCO2 = (value: number): string => {
    return value.toFixed(2);
  };

  // Format percentage change
  const formatPercentChange = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`;
  };

  // Check if we're still loading initial data
  const isLoading = 
    isLoadingOrganizations || 
    isLoadingCostTrend || 
    isLoadingHealthMetrics || 
    isLoadingOptimizationData ||
    isLoadingCloudAccounts;

  // Check for errors
  const error = 
    organizationsError || 
    costTrendError || 
    healthMetricsError || 
    optimizationDataError ||
    cloudAccountsError;

  // Generate chart data from API response with proper date formatting
  const chartData = (costTrendData && Array.isArray(costTrendData)) ? costTrendData.map((item) => {
    const date = new Date(item.date);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return {
      name: `${day} ${month}`,
      costs: item.cost,
      savings: 0 // Will come from optimization data when available
    };
  }) : [];

  // Generate table data from resource breakdown
  const tableData = (resourceBreakdown && Array.isArray(resourceBreakdown)) ? resourceBreakdown.slice(0, 6).map(item => ({
    name: item.name,
    cost: formatCurrency(item.cost),
    savings: '$0.00' // Future: calculate from optimization recommendations
  })) : [];

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar onChatToggle={handleChatToggle} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6">
              <h2 className="text-xl font-medium text-red-600 mb-2">Error Loading Dashboard</h2>
              <p className="text-gray-600 mb-4">
                {error instanceof Error ? error.message : 'An unknown error occurred'}
              </p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </div>
        <SupportChat isOpen={isChatOpen} onClose={handleChatClose} onOpen={handleChatOpen} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar onChatToggle={handleChatToggle} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-gray-500">Loading dashboard data...</p>
            </div>
          </div>
        </div>
        <SupportChat isOpen={isChatOpen} onClose={handleChatClose} onOpen={handleChatOpen} />
      </div>
    );
  }

  // Check if user needs onboarding (no organizations)
  if (!isLoadingOrganizations && organizations && organizations.length === 0) {
    return <Navigate to="/onboarding/welcome" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onChatToggle={handleChatToggle} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />


        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-gray-500 mb-4">
              <Home size={16} />
              <ChevronRight size={14} />
              <span className="text-sm">Dashboard</span>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <span>Dashboard</span>
              </h2>
              <div className="flex items-center gap-3">
                <DateRangePicker />
                <Button className="flex items-center gap-2 h-9 bg-blue-500 hover:bg-blue-600">
                  <PlusCircle size={16} />
                  <span className="text-sm">Add filter</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <StatsCard
                title="Total savings"
                value={formatCurrency(optimizationData?.summary?.totalSavings || 0)}
                icon={<Info size={16} className="text-gray-400" />}
                className="bg-green-500 text-white"
                tooltip="Total cost savings from applied optimizations"
              />

              <StatsCard
                title="Projected monthly cost"
                value={formatCurrency(costSummary.forecastedCost)}
                icon={<Info size={16} className="text-gray-400" />}
                description={
                  <div className={`flex items-center ${costSummary.percentChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {costSummary.percentChange > 0 ? (
                      <TrendingUp size={16} className="mr-1" />
                    ) : (
                      <TrendingDown size={16} className="mr-1" />
                    )}
                    <span>{formatPercentChange(costSummary.percentChange)} vs previous period</span>
                  </div>
                }
                tooltip="Forecasted cost for the current month based on current usage patterns"
              />

              <StatsCard
                title="Potential annual savings"
                value={formatCurrency((optimizationData?.summary?.totalSavings || 0) * 12)}
                icon={<Info size={16} className="text-gray-400" />}
                tooltip="Estimated annual savings if all optimization recommendations are applied"
              />

              <StatsCard
                title="Applied monthly savings"
                value={formatCurrency(0)}  // This will come from API when available
                icon={<Info size={16} className="text-gray-400" />}
                className="text-red-500"
                tooltip="Cost savings from optimizations that have been applied"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <StatsCard
                title="Total CO2 saved"
                value={
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold mr-2">
                      {formatCO2(healthMetrics?.metrics.find(m => m.name === 'co2_saved')?.value || 0)}
                    </span>
                    <span className="text-sm text-gray-500">kg</span>
                  </div>
                }
                icon={<Info size={16} className="text-gray-400" />}
                className="bg-blue-500 text-white"
                tooltip="Total CO2 emissions saved through optimizations"
              />

              <StatsCard
                title="Eco-saver score"
                value={<span>{Math.round(healthMetrics?.healthScore || 0)}</span>}
                icon={<Info size={16} className="text-gray-400" />}
                description={<EcoIcon />}
                tooltip="Score based on resource efficiency and environmental impact"
              />

              <StatsCard
                title="CO2 impact this month"
                value={
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold mr-2">
                      {formatCO2(healthMetrics?.metrics.find(m => m.name === 'co2_current')?.value || 105.52)}
                    </span>
                    <span className="text-sm text-gray-500">kg</span>
                  </div>
                }
                description={
                  <div className="flex items-center text-green-500">
                    <TrendingDown size={16} className="mr-1" />
                    <span>-4% vs last month</span>
                  </div>
                }
                tooltip="Current month's CO2 emissions from cloud resources"
              />

              <StatsCard
                title="Total CO2 impact"
                value={
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold mr-2">
                      {formatCO2(healthMetrics?.metrics.find(m => m.name === 'co2_total')?.value || 383.14)}
                    </span>
                    <span className="text-sm text-gray-500">kg</span>
                  </div>
                }
                tooltip="Total CO2 emissions from all cloud resources since tracking began"
              />
            </div>

            <div className="mb-6">
              <CostChart 
                data={chartData} 
                isLoading={isLoadingCostTrend || isLoadingAwsCosts}
                title="Daily Cost Trends"
              />
            </div>

            <div className="mb-6">
              <Card>
                <CardContent className="p-0">
                  <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-medium">Costs vs savings trend</h3>
                    <div className="flex">
                      <Button
                        variant={viewMode === 'chart' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs rounded-r-none"
                        onClick={() => setViewMode('chart')}
                      >
                        Chart
                      </Button>
                      <Button
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs rounded-l-none"
                        onClick={() => setViewMode('table')}
                      >
                        Table
                      </Button>
                    </div>
                  </div>

                  {viewMode === 'table' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Resource Name</th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-gray-600">
                              <div className="flex items-center justify-end">
                                <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                                Costs
                              </div>
                            </th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-gray-600">
                              <div className="flex items-center justify-end">
                                <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                                Savings
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(tableData && Array.isArray(tableData)) && tableData.map((row, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-blue-500">{row.name}</td>
                              <td className="py-3 px-4 text-right text-sm">{row.cost}</td>
                              <td className="py-3 px-4 text-right text-sm">{row.savings}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="h-80 p-4">
                      {/* Chart content already handled by the CostChart component */}
                      <div className="flex justify-center items-center h-full text-gray-500">
                        Additional chart view would appear here
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-4">Costs per Account</h3>
                  <div className="flex justify-center">
                    <div className="relative w-48 h-48">
                      <div className="rounded-full w-full h-full border-[20px] border-indigo-500"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-xl font-bold">{formatCurrency(costSummary.totalCost)}</div>
                        <div className="text-sm text-gray-500">100%</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-center">
                    {(accountBreakdown && Array.isArray(accountBreakdown)) && accountBreakdown.map((account, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 mr-1"></div>
                        <span className="text-xs">{account.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-4">Costs per Region</h3>
                  <div className="flex justify-center">
                    <div className="relative w-48 h-48">
                      <div className="rounded-full w-full h-full border-[20px] border-indigo-500"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-xl font-bold">{formatCurrency(costSummary.totalCost)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    {(regionBreakdown && Array.isArray(regionBreakdown)) && regionBreakdown.map((region, index) => (
                      <div key={index} className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-indigo-500' : 'bg-yellow-500'} mr-1`}></div>
                        <span className="text-xs">{region.name} ({region.value}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-4">Costs per Resource Type</h3>
                  <div className="flex justify-center">
                    <div className="relative w-48 h-48">
                      <div className="rounded-full w-full h-full border-[16px] border-indigo-500 border-t-blue-400 border-r-orange-400 border-b-blue-300"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-xl font-bold">{formatCurrency(costSummary.totalCost)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {(resourceBreakdown && Array.isArray(resourceBreakdown)) && resourceBreakdown.map((resource, index) => {
                      const colorClasses = [
                        'bg-indigo-500',
                        'bg-yellow-500',
                        'bg-blue-300',
                        'bg-blue-400',
                        'bg-orange-400'
                      ];
                      return (
                        <div key={index} className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${colorClasses[index % colorClasses.length]} mr-1`}></div>
                          <span className="text-xs">{resource.name} ({resource.value}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <SupportChat isOpen={isChatOpen} onClose={handleChatClose} onOpen={handleChatOpen} />
    </div>
  );
};

export default Dashboard;