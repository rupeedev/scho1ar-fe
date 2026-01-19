import React, { useState, useEffect } from 'react';
import {
  Home,
  PlusCircle,
  ChevronRight,
  Calendar,
  ChevronDown,
  HelpCircle,
  DollarSign,
  CircleCheck,
  CircleX,
  Cpu,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import StatsCard from '@/components/dashboard/StatsCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { costsApi, resourcesApi, cloudAccountsApi, OptimizationLabData, OptimizationRecommendation } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

// Interface for the cost chart data
interface CostChartDataPoint {
  name: string;
  date: string;
  optimizedCosts: number;
  underutilizedCosts: number;
}

// Interface for underutilized resources
interface UnderutilizedResource {
  id: string;
  name: string;
  type: string;
  account: string;
  accountId: string;
  region: string;
  underutilizedCosts: number;
  percentOfTime: number;
  peakMaxCPU: number;
  avgMaxCPU: number;
  deltaCPU: number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 p-3 rounded-md shadow-md">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-gray-600">
          <span className="inline-block w-3 h-3 bg-gray-300 mr-1"></span>
          Underutilized costs: {formatCurrency(payload[0]?.value || 0)}
        </p>
        <p className="text-sm text-gray-600">
          <span className="inline-block w-3 h-3 bg-green-500 mr-1"></span>
          Optimized costs: {formatCurrency(payload[1]?.value || 0)}
        </p>
      </div>
    );
  }
  return null;
};

const OptimizationLab = () => {
  const [loading, setLoading] = useState(true);
  const [optimizationData, setOptimizationData] = useState<OptimizationLabData | null>(null);
  const [costChartData, setCostChartData] = useState<CostChartDataPoint[]>([]);
  const [accountNames, setAccountNames] = useState<Record<string, string>>({});
  const [underutilizedResources, setUnderutilizedResources] = useState<UnderutilizedResource[]>([]);
  const [cpuThreshold, setCpuThreshold] = useState(20);

  // Date range for cost data
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

  const organizationId = '1'; // TODO: Get from context or URL params

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch optimization lab data
        const labData = await costsApi.getOptimizationLab(organizationId);
        setOptimizationData(labData);
        
        // Fetch cloud accounts to get their names
        const accounts = await cloudAccountsApi.getAll(organizationId);
        const accountNamesMap: Record<string, string> = {};
        accounts.forEach(account => {
          accountNamesMap[account.id] = account.name;
        });
        setAccountNames(accountNamesMap);
        
        // Fetch cost trend data to build chart data
        const costTrend = await costsApi.getCostTrend(
          organizationId,
          dateRange.startDate,
          dateRange.endDate,
          'daily'
        );
        
        // Transform cost trend data for the chart
        // We'll assume 20% of costs are optimized and 80% are underutilized for demonstration
        // In a real app, this would come from the backend
        const chartData = costTrend.map(item => {
          const date = new Date(item.date);
          const month = date.toLocaleString('default', { month: 'short' });
          const day = date.getDate();
          
          return {
            name: `${day} ${month}`,
            date: item.date,
            optimizedCosts: item.cost * 0.2, // Assume 20% optimized
            underutilizedCosts: item.cost * 0.8, // Assume 80% underutilized
          };
        });
        setCostChartData(chartData);
        
        // Process recommendations to build underutilized resources list
        if (labData && labData.recommendations) {
          const resources: UnderutilizedResource[] = labData.recommendations
            .filter(rec => rec.recommendationType.includes('underutilized'))
            .map(rec => {
              // Extract CPU metrics from recommendation details
              const cpuMetrics = rec.details?.cpuMetrics || {
                peakMaxCPU: Math.round(Math.random() * 20),
                avgMaxCPU: Math.round(Math.random() * 15),
                deltaCPU: Math.round(Math.random() * 10)
              };
              
              return {
                id: rec.id,
                name: rec.resourceName,
                type: rec.resourceType,
                account: accountNamesMap[rec.details?.cloudAccountId || ''] || 'Unknown Account',
                accountId: rec.details?.cloudAccountId || 'Unknown',
                region: rec.details?.region || 'us-west-2',
                underutilizedCosts: rec.potentialSavings,
                percentOfTime: rec.details?.percentOfTime || 100,
                peakMaxCPU: cpuMetrics.peakMaxCPU,
                avgMaxCPU: cpuMetrics.avgMaxCPU,
                deltaCPU: cpuMetrics.deltaCPU
              };
            });
          
          setUnderutilizedResources(resources);
        }
        
      } catch (error) {
        console.error('Error fetching optimization data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch optimization data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [organizationId, dateRange]);

  // Calculate summary values
  const totalCost = optimizationData?.summary?.totalSavings || 0;
  const optimizedCosts = costChartData.reduce((sum, item) => sum + item.optimizedCosts, 0);
  const underutilizedCosts = costChartData.reduce((sum, item) => sum + item.underutilizedCosts, 0);
  
  const optimizedPercentage = totalCost > 0 
    ? Math.round((optimizedCosts / totalCost) * 100) 
    : 0;
    
  const underutilizedPercentage = totalCost > 0 
    ? Math.round((underutilizedCosts / totalCost) * 100) 
    : 0;

  // Calculate breakdown data for the horizontal bar chart
  const breakdownData = Object.entries(accountNames).map(([id, name]) => {
    const accountResources = underutilizedResources.filter(r => r.accountId === id);
    const underutilizedCost = accountResources.reduce((sum, r) => sum + r.underutilizedCosts, 0);
    const totalCost = underutilizedCost * 1.25; // Assume total is 25% higher than underutilized
    const optimizedCost = totalCost - underutilizedCost;
    
    return {
      account: name,
      accountId: id,
      underutilizedCosts: underutilizedCost,
      optimizedCosts: optimizedCost,
      total: totalCost
    };
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="bg-blue-50 border-b border-blue-100 p-2 text-sm text-blue-700">
          Your subscription trial period ends in 1 day.
          <a href="/" className="text-blue-700 font-medium hover:underline ml-1">Click here</a> to set your default payment method.
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mr-2" />
              <span>Loading optimization data...</span>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto p-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-gray-500 mb-4">
                <Home size={16} />
                <ChevronRight size={14} />
                <span className="text-sm">Optimization Lab</span>
              </div>

              {/* Date range selector and filter */}
              <div className="flex justify-between items-center mb-6">
                <div className="bg-white border border-gray-200 rounded-md px-3 py-1.5 flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-gray-500" />
                  <span>{dateRange.startDate} - {dateRange.endDate}</span>
                </div>
                <Button
                  variant="default"
                  className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                  size="sm"
                >
                  <PlusCircle size={16} />
                  <span>Add filter</span>
                </Button>
              </div>

              {/* Cost optimization stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatsCard
                  title="Total cost"
                  value={formatCurrency(totalCost)}
                  className="h-24"
                  icon={<DollarSign size={18} className="text-gray-500" />}
                  tooltip="The total cost across all resources for the selected period"
                />

                <StatsCard
                  title="Optimized costs"
                  value={formatCurrency(optimizedCosts)}
                  percentage={`${optimizedPercentage}%`}
                  className="h-24"
                  icon={<CircleCheck size={18} className="text-emerald-500" />}
                  color="green"
                  tooltip="Costs for resources that are properly utilized"
                />

                <StatsCard
                  title="Underutilized costs"
                  value={formatCurrency(underutilizedCosts)}
                  percentage={`${underutilizedPercentage}%`}
                  className="h-24"
                  icon={<CircleX size={18} className="text-red-500" />}
                  color="red"
                  tooltip="Costs for resources that are underutilized"
                />

                <StatsCard
                  title={`CPU utilization threshold ${cpuThreshold}%`}
                  value={
                    <Slider
                      defaultValue={[cpuThreshold]}
                      max={100}
                      step={10}
                      onValueChange={(values) => setCpuThreshold(values[0])}
                      className="cursor-pointer"
                    />
                  }
                  className="h-24"
                  icon={<Cpu size={18} className="text-gray-500" />}
                  tooltip="The CPU utilization threshold used to determine if a resource is underutilized"
                />
              </div>

              {/* Cost optimization chart */}
              <div className="bg-white rounded-md border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-800 mb-2">Cost optimization trend</h2>

                {costChartData.length === 0 ? (
                  <div className="h-96 flex items-center justify-center text-gray-500">
                    No cost data available for the selected time period
                  </div>
                ) : (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={costChartData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 60,
                          bottom: 60,
                        }}
                        barGap={0}
                        barSize={18}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: '#e0e0e0' }}
                          height={50}
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="underutilizedCosts" stackId="a" fill="#CCCCCC" />
                        <Bar dataKey="optimizedCosts" stackId="a" fill="#4ADE80" />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="flex justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-gray-300"></div>
                        <span className="text-sm text-gray-600">Underutilized costs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                        <span className="text-sm text-gray-600">Optimized costs</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cost optimization breakdown */}
              <div className="bg-white rounded-md border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-medium text-gray-800">Cost optimization breakdown</h2>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">Group by</span>
                    <div className="relative">
                      <button className="border border-gray-200 rounded-md py-1 px-3 text-sm flex items-center min-w-[150px] justify-between">
                        Account
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {breakdownData.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-gray-500">
                    No breakdown data available
                  </div>
                ) : (
                  <div className="space-y-5">
                    {breakdownData.map((item, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{item.account}</span>
                        </div>
                        <div className="relative h-6">
                          <div className="h-6 rounded-md bg-gray-300 overflow-hidden w-full">
                            <div
                              className="h-full bg-emerald-400 rounded-r-md"
                              style={{
                                width: `${(item.optimizedCosts / item.total) * 100}%`,
                                position: 'absolute',
                                right: 0,
                                top: 0
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 pt-1">
                          <div className="flex items-center">
                            <span className="mr-2">{formatCurrency(item.underutilizedCosts)}</span>
                            <span className="text-gray-400">|</span>
                            <span className="ml-2">{formatCurrency(item.total)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-center gap-6 mt-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-gray-300"></div>
                    <span className="text-sm text-gray-600">Underutilized costs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                    <span className="text-sm text-gray-600">Optimized costs</span>
                  </div>
                </div>

                {/* Toggle buttons */}
                <div className="flex justify-end mt-4">
                  <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
                    <Button
                      variant="default"
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-r-none border-r"
                      size="sm"
                    >
                      Absolute, $
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-transparent text-gray-500 rounded-l-none"
                      size="sm"
                    >
                      Percentage, %
                    </Button>
                  </div>
                </div>
              </div>

              {/* Top underutilized resources */}
              <div className="bg-white rounded-md border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Top underutilized resources</h2>

                {underutilizedResources.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-gray-500">
                    No underutilized resources found
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="whitespace-nowrap">Resource name</TableHead>
                          <TableHead className="whitespace-nowrap">Account</TableHead>
                          <TableHead className="whitespace-nowrap">Region</TableHead>
                          <TableHead className="whitespace-nowrap">
                            <div className="flex items-center">
                              Underutilized costs
                              <HelpCircle size={14} className="ml-1 text-gray-400" />
                            </div>
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            <div className="flex items-center">
                              Peak Max CPU
                              <HelpCircle size={14} className="ml-1 text-gray-400" />
                            </div>
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            <div className="flex items-center">
                              Avg Max CPU
                              <HelpCircle size={14} className="ml-1 text-gray-400" />
                            </div>
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            <div className="flex items-center">
                              Delta CPU
                              <HelpCircle size={14} className="ml-1 text-gray-400" />
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {underutilizedResources.map((resource, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <div>
                                <div className="text-blue-500 hover:underline cursor-pointer">{resource.name}</div>
                                <div className="text-xs text-gray-500">{resource.type}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-blue-500">{resource.account}</div>
                                <div className="text-xs text-gray-500">{resource.accountId}</div>
                              </div>
                            </TableCell>
                            <TableCell>{resource.region}</TableCell>
                            <TableCell>
                              <div>
                                <div>{formatCurrency(resource.underutilizedCosts)}</div>
                                <div className="text-xs text-gray-500">{resource.percentOfTime}% of time</div>
                              </div>
                            </TableCell>
                            <TableCell>{resource.peakMaxCPU}%</TableCell>
                            <TableCell>{resource.avgMaxCPU}%</TableCell>
                            <TableCell>{resource.deltaCPU}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptimizationLab;