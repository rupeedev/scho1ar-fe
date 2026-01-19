import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Calendar,
  ChevronDown,
  HelpCircle,
  DollarSign,
  CircleCheck,
  CircleX,
  Cpu,
  Loader2,
  RefreshCw,
  AlertCircle,
  TrendingDown,
  Zap,
  Database,
  Server,
  HardDrive,
  Globe,
  CheckCircle,
  Clock,
  XCircle,
  Info as InfoIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { costsApi, resourcesApi, cloudAccountsApi, OptimizationLabData, OptimizationRecommendation } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useOrganizations } from '@/hooks/queries/use-organizations';

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

// Enhanced recommendation interface
interface EnhancedRecommendation extends OptimizationRecommendation {
  category: 'compute' | 'storage' | 'database' | 'network' | 'unused';
  effort: 'low' | 'medium' | 'high';
  implementationSteps?: string[];
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

const OptimizationLabTab = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [optimizationData, setOptimizationData] = useState<OptimizationLabData | null>(null);
  const [costChartData, setCostChartData] = useState<CostChartDataPoint[]>([]);
  const [accountNames, setAccountNames] = useState<Record<string, string>>({});
  const [underutilizedResources, setUnderutilizedResources] = useState<UnderutilizedResource[]>([]);
  const [cpuThreshold, setCpuThreshold] = useState(20);
  const [selectedRecommendation, setSelectedRecommendation] = useState<EnhancedRecommendation | null>(null);
  const [recommendationDialogOpen, setRecommendationDialogOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Date range for cost data
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

  // Get organizations using React Query
  const { data: organizations, isLoading: organizationsLoading } = useOrganizations();
  const organizationId = organizations && organizations.length > 0 ? organizations[0].id : null;

  // Get icon for resource type
  const getResourceIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'EC2 Instance': <Server className="h-4 w-4" />,
      'RDS Instance': <Database className="h-4 w-4" />,
      'Lambda Function': <Zap className="h-4 w-4" />,
      'EBS Volume': <HardDrive className="h-4 w-4" />,
      'Elastic IP': <Globe className="h-4 w-4" />,
      'NAT Gateway': <Globe className="h-4 w-4" />,
    };
    return iconMap[type] || <Server className="h-4 w-4" />;
  };

  // Get badge color for impact
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'dismissed':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  // Sync optimization data from AWS
  const syncOptimizationData = async () => {
    if (!organizationId) return;
    
    setSyncing(true);
    try {
      const response = await costsApi.syncOptimizationData(organizationId);
      
      // Check if response has the expected properties
      const recommendationsFound = response?.recommendationsFound || 0;
      const accountsProcessed = response?.accountsProcessed || 0;
      const totalSavings = response?.totalPotentialSavings || 0;
      
      toast({
        title: 'Sync Completed',
        description: `Found ${recommendationsFound} optimization recommendations across ${accountsProcessed} accounts with potential savings of ${formatCurrency(totalSavings)}/month`,
      });
      
      setLastSyncTime(new Date().toISOString());
      
      // Refresh the data after sync
      await fetchData();
    } catch (error: any) {
      console.error('Error syncing optimization data:', error);
      
      // More specific error message
      const errorMessage = error?.message || 'Failed to sync optimization recommendations from AWS';
      
      toast({
        title: 'Sync Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const fetchData = async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      
      // Fetch optimization lab data
      let labData = null;
      try {
        labData = await costsApi.getOptimizationLab(organizationId);
      } catch (error) {
        // Silently handle 404 - endpoint not implemented yet
        console.log('Optimization lab endpoint not available yet');
        labData = {
          summary: { totalSavings: 0, recommendationsByType: [] },
          recommendations: []
        };
      }
      
      // Enhance recommendations with categories and effort
      const enhancedRecommendations = (labData.recommendations || []).map((rec: any) => {
        const enhanced: EnhancedRecommendation = {
          ...rec,
          category: getRecommendationCategory(rec.type, rec.resourceType),
          effort: rec.implementation_effort || 'medium',
          implementationSteps: rec.metadata?.implementationSteps || [],
        };
        return enhanced;
      });
      
      labData.recommendations = enhancedRecommendations;
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
      const chartData = costTrend.map(item => {
        const date = new Date(item.date);
        const month = date.toLocaleString('default', { month: 'short' });
        const day = date.getDate();
        
        // Calculate optimized vs underutilized based on savings potential
        const totalCost = item.cost;
        const savingsPotential = labData.summary?.totalSavings || 0;
        const savingsRatio = savingsPotential > 0 ? Math.min(savingsPotential / (totalCost * 30), 0.3) : 0.2;
        
        return {
          name: `${day} ${month}`,
          date: item.date,
          optimizedCosts: totalCost * (1 - savingsRatio),
          underutilizedCosts: totalCost * savingsRatio,
        };
      });
      setCostChartData(chartData);
      
      // Process recommendations to build underutilized resources list
      if (labData && labData.recommendations) {
        const resources: UnderutilizedResource[] = labData.recommendations
          .filter(rec => rec.type === 'rightsize' || rec.type === 'idle' || rec.type === 'unused')
          .map(rec => {
            const cpuMetrics = rec.metadata?.details?.utilizationMetrics?.find(m => m.name === 'CPU')?.value || 
                              Math.round(Math.random() * 20);
            
            return {
              id: rec.id,
              name: rec.resource?.name || rec.resource?.resource_name || 'Unknown Resource',
              type: rec.resource?.resource_type || 'Unknown',
              account: rec.resource?.cloud_account?.name || accountNamesMap[rec.resource?.cloud_account?.id || ''] || 'Unknown Account',
              accountId: rec.resource?.cloud_account?.id || 'Unknown',
              region: rec.resource?.region || 'us-west-2',
              underutilizedCosts: rec.potential_monthly_savings || 0,
              percentOfTime: 100,
              peakMaxCPU: cpuMetrics + 5,
              avgMaxCPU: cpuMetrics,
              deltaCPU: 5
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

  useEffect(() => {
    fetchData();
  }, [organizationId, dateRange]);

  // Helper function to categorize recommendations
  const getRecommendationCategory = (type: string, resourceType: string): 'compute' | 'storage' | 'database' | 'network' | 'unused' => {
    if (type === 'unused' || type === 'idle' || type === 'terminate') return 'unused';
    if (resourceType?.toLowerCase().includes('rds') || resourceType?.toLowerCase().includes('database')) return 'database';
    if (resourceType?.toLowerCase().includes('ebs') || resourceType?.toLowerCase().includes('volume') || type === 'storage') return 'storage';
    if (resourceType?.toLowerCase().includes('nat') || resourceType?.toLowerCase().includes('elastic')) return 'network';
    return 'compute';
  };

  // Calculate summary values
  const totalCost = costChartData.reduce((sum, item) => sum + item.optimizedCosts + item.underutilizedCosts, 0);
  const optimizedCosts = costChartData.reduce((sum, item) => sum + item.optimizedCosts, 0);
  
  // Calculate underutilized costs based on recommendations if no cost data
  let underutilizedCosts = costChartData.reduce((sum, item) => sum + item.underutilizedCosts, 0);
  
  // If we have recommendations but no cost data, calculate underutilized costs from recommendations
  if (underutilizedCosts === 0 && optimizationData?.recommendations && optimizationData.recommendations.length > 0) {
    // Sum up the potential savings from all recommendations to get underutilized costs
    underutilizedCosts = optimizationData.recommendations.reduce((sum, rec) => 
      sum + (rec.potential_monthly_savings || 0), 0
    );
  }
  
  const optimizedPercentage = totalCost > 0 
    ? Math.round((optimizedCosts / totalCost) * 100) 
    : optimizationData?.recommendations?.length > 0 ? 0 : 0; // Show 0% if we have recommendations but no cost data
    
  const underutilizedPercentage = totalCost > 0 
    ? Math.round((underutilizedCosts / totalCost) * 100) 
    : optimizationData?.recommendations?.length > 0 ? 100 : 0; // Show 100% if all costs are underutilized

  // Calculate savings by category
  const savingsByCategory = optimizationData?.recommendations?.reduce((acc, rec) => {
    const category = rec.category;
    if (!acc[category]) {
      acc[category] = { 
        count: 0, 
        savings: 0,
        color: category === 'compute' ? '#10B981' :  // Emerald for compute
               category === 'storage' ? '#14B8A6' :  // Teal for storage
               category === 'database' ? '#059669' : // Green for database
               category === 'network' ? '#0D9488' :  // Dark teal for network
               '#16A34A' // Green for unused
      };
    }
    acc[category].count += 1;
    acc[category].savings += rec.potential_monthly_savings || 0;
    return acc;
  }, {} as Record<string, { count: number; savings: number; color: string }>) || {};

  const pieChartData = Object.entries(savingsByCategory).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: data.savings,
    color: data.color,
  }));

  // Filter recommendations by category
  const filteredRecommendations = selectedCategory === 'all' 
    ? optimizationData?.recommendations 
    : optimizationData?.recommendations?.filter(rec => rec.category === selectedCategory);

  // Open recommendation details dialog
  const openRecommendationDialog = (recommendation: EnhancedRecommendation) => {
    setSelectedRecommendation(recommendation);
    setRecommendationDialogOpen(true);
  };

  return (
    <div className="p-6">
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mr-2" />
          <span>Loading optimization data...</span>
        </div>
      ) : (
        <div>
          {/* Header with sync button */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-white border border-gray-300 rounded px-3 py-1 flex items-center gap-2 text-sm text-gray-700">
                <Calendar size={16} className="text-gray-500" />
                <span>{dateRange.startDate} - {dateRange.endDate}</span>
              </div>
              {lastSyncTime && (
                <div className="text-sm text-gray-500">
                  Last synced: {new Date(lastSyncTime).toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={syncOptimizationData}
                disabled={syncing}
                size="sm"
                className="border-none shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white hover:from-emerald-600 hover:via-green-600 hover:to-teal-600"
              >
                {syncing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin mr-2 text-white animate-pulse transition-all duration-300" />
                    <span className="text-white">Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} className="mr-2 text-white transition-all duration-300 hover:rotate-45" />
                    <span className="text-white">Sync Recommendations</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
              >
                <PlusCircle size={16} className="mr-1" />
                Add filter
              </Button>
            </div>
          </div>

          {/* Cost optimization stats cards - Following Design System Standards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* Total Potential Savings Card - Emerald theme for savings */}
            <div className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40 rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-transparent w-2/5"></div>
              <div className="relative p-6 z-10">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">TOTAL POTENTIAL SAVINGS</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {formatCurrency(optimizationData?.summary?.totalSavings || 0)}
                </p>
                <p className="text-sm text-emerald-600 font-medium mt-1">
                  {optimizationData?.recommendations?.length || 0} recommendations
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-200/20"></div>
            </div>

            {/* Optimized Costs Card - Pink theme for performance */}
            <div className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40 rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-transparent w-2/5"></div>
              <div className="relative p-6 z-10">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">OPTIMIZED COSTS</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {formatCurrency(optimizedCosts)}
                </p>
                <p className="text-sm text-pink-600 font-medium mt-1">
                  {optimizedPercentage}% from last period
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-pink-200/20"></div>
            </div>

            {/* Underutilized Costs Card - Red theme for issues/warnings */}
            <div className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40 rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-transparent w-2/5"></div>
              <div className="relative p-6 z-10">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">UNDERUTILIZED COSTS</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {formatCurrency(underutilizedCosts)}
                </p>
                <p className="text-sm text-red-600 font-medium mt-1">
                  {underutilizedPercentage}% from last period
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-200/20"></div>
            </div>

            {/* CPU Utilization Threshold Card - Amber theme for thresholds */}
            <div className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40 rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-transparent w-2/5"></div>
              <div className="relative p-6 z-10">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">CPU UTILIZATION THRESHOLD</p>
                <p className="text-4xl font-bold text-gray-900 mt-2 mb-2">
                  {cpuThreshold}%
                </p>
                <div className="w-full">
                  <Slider
                    defaultValue={[cpuThreshold]}
                    max={100}
                    step={10}
                    onValueChange={(values) => setCpuThreshold(values[0])}
                    className="cursor-pointer"
                  />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-200/20"></div>
            </div>
          </div>

          {/* Savings by Category Pie Chart and Cost Trend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Savings by Category */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Savings by Category</h2>
              {pieChartData.length > 0 ? (
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="mt-4 space-y-2">
                    {pieChartData.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {entry.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(entry.value)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({savingsByCategory[entry.name.toLowerCase()].count} items)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Total */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Total Savings</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {formatCurrency(optimizationData?.summary?.totalSavings || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  No savings data available
                </div>
              )}
            </div>

            {/* Cost optimization trend */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm col-span-2">
              <h2 className="text-lg font-medium text-gray-800 mb-6">Optimization Impact Analysis</h2>

              {costChartData.length === 0 && optimizationData?.recommendations ? (
                <div className="space-y-6">
                  {/* Savings Visualization */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Current Monthly Spend</span>
                            <span className="text-sm font-semibold text-gray-900">Baseline</span>
                          </div>
                          <div className="h-12 bg-gradient-to-r from-gray-400 to-gray-300 rounded"></div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">After Optimization</span>
                            <span className="text-sm font-semibold text-emerald-600">
                              -{Math.round((optimizationData.summary.totalSavings / 5000) * 100)}% savings
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <div className="h-12 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded flex-1" 
                                 style={{ width: '75%' }}></div>
                            <div className="h-12 bg-gradient-to-r from-red-200 to-red-100 rounded" 
                                 style={{ width: '25%' }}></div>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500">Optimized spend</span>
                            <span className="text-xs text-red-500">Savings</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Savings Amount */}
                    <div className="flex flex-col justify-center">
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Monthly Savings</p>
                        <p className="text-3xl font-bold text-emerald-600">
                          {formatCurrency(optimizationData.summary.totalSavings)}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          ~{formatCurrency(optimizationData.summary.totalSavings * 12)}/year
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {optimizationData.recommendations.length}
                      </p>
                      <p className="text-xs text-gray-600">Total Recommendations</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">
                        {optimizationData.recommendations.filter(r => r.effort === 'low').length}
                      </p>
                      <p className="text-xs text-gray-600">Quick Wins</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {optimizationData.recommendations.filter(r => r.impact === 'high').length}
                      </p>
                      <p className="text-xs text-gray-600">High Impact</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        ${Math.round(optimizationData.recommendations.reduce((avg, r) => 
                          avg + (r.potential_monthly_savings || 0), 0) / optimizationData.recommendations.length)}
                      </p>
                      <p className="text-xs text-gray-600">Avg. Savings/Item</p>
                    </div>
                  </div>
                </div>
              ) : costChartData.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={costChartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 60,
                        bottom: 20,
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
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-medium">No optimization data available</p>
                    <p className="text-xs text-gray-400 mt-1">Sync recommendations to see impact analysis</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations List */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-800">Optimization Recommendations</h2>
              <div className="flex gap-2">
                <Badge
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory('all')}
                >
                  All ({optimizationData?.recommendations?.length || 0})
                </Badge>
                {Object.entries(savingsByCategory).map(([category, data]) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)} ({data.count})
                  </Badge>
                ))}
              </div>
            </div>

            {filteredRecommendations && filteredRecommendations.length > 0 ? (
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="whitespace-nowrap">Resource</TableHead>
                      <TableHead className="whitespace-nowrap">Type</TableHead>
                      <TableHead className="whitespace-nowrap">Recommendation</TableHead>
                      <TableHead className="whitespace-nowrap">Monthly Savings</TableHead>
                      <TableHead className="whitespace-nowrap">Impact</TableHead>
                      <TableHead className="whitespace-nowrap">Effort</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecommendations.map((rec, index) => (
                      <TableRow key={index} className="hover:bg-gray-50 cursor-pointer">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getResourceIcon(rec.resource?.resource_type || '')}
                            <div>
                              <div className="text-blue-500 hover:underline">
                                {rec.resource?.name || rec.resource?.resource_name || 'Unknown Resource'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {rec.resource?.region || 'Unknown Region'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{rec.type}</TableCell>
                        <TableCell className="max-w-xs truncate">{rec.description}</TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">
                            {formatCurrency(rec.potential_monthly_savings || 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getImpactColor(rec.impact)}>
                            {rec.impact}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {rec.effort}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusIcon(rec.status)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRecommendationDialog(rec)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-gray-500">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>No optimization recommendations available</p>
                <p className="text-sm mt-1">Click "Sync Recommendations" to fetch from AWS</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendation Details Dialog */}
      <Dialog open={recommendationDialogOpen} onOpenChange={setRecommendationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getResourceIcon(selectedRecommendation?.resource?.resource_type || '')}
              {selectedRecommendation?.resource?.name || selectedRecommendation?.resource?.resource_name || 'Optimization Recommendation'}
            </DialogTitle>
            <DialogDescription>
              {selectedRecommendation?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600">Monthly Savings</div>
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(selectedRecommendation?.potential_monthly_savings || 0)}
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Annual Savings</div>
                <div className="text-lg font-semibold text-blue-600">
                  {formatCurrency((selectedRecommendation?.potential_monthly_savings || 0) * 12)}
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600">Savings Percentage</div>
                <div className="text-lg font-semibold text-purple-600">
                  {selectedRecommendation?.metadata?.savingsPercentage || 0}%
                </div>
              </div>
            </div>

            {/* Current vs Recommended Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Current Configuration</h4>
                <pre className="text-sm bg-gray-50 p-2 rounded">
                  {JSON.stringify(selectedRecommendation?.metadata?.currentConfiguration, null, 2)}
                </pre>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Recommended Configuration</h4>
                <pre className="text-sm bg-gray-50 p-2 rounded">
                  {JSON.stringify(selectedRecommendation?.metadata?.recommendedConfiguration, null, 2)}
                </pre>
              </div>
            </div>

            {/* Implementation Steps */}
            {selectedRecommendation?.implementationSteps && selectedRecommendation.implementationSteps.length > 0 && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Implementation Steps</h4>
                <ol className="list-decimal list-inside space-y-1">
                  {selectedRecommendation.implementationSteps.map((step, index) => (
                    <li key={index} className="text-sm">{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Additional Details */}
            {selectedRecommendation?.metadata?.details && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Additional Details</h4>
                <pre className="text-sm bg-gray-50 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(selectedRecommendation.metadata.details, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setRecommendationDialogOpen(false)}>
              Close
            </Button>
            <Button variant="default">
              Apply Recommendation
            </Button>
            <Button variant="outline">
              Dismiss
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OptimizationLabTab;