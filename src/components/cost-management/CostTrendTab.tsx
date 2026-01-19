import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Loader2, RefreshCw, BarChart3, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import DateRangePicker from '../dashboard/DateRangePicker';
import { costsApi } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { useOrganizations } from '@/hooks/queries/use-organizations';
import { useCostTrendWithForecast, useSyncCostData, useSyncStatus } from '@/hooks/queries/use-costs';
import { subDays } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  TooltipProps,
  Legend
} from 'recharts';

// AWS service colors with nature-inspired palette
const AWS_SERVICE_COLORS = {
  'VPC': '#3b82f6',
  'Relational Database Service': '#f97316', 
  'EC2-Other': '#10b981',
  'Config': '#ef4444',
  'Elastic Container Service': '#8b5cf6',
  'Security Hub': '#f59e0b',
  'CloudTrail': '#ec4899',
  'Elastic Load Balancing': '#22c55e', // Forest green
  'EC2-Instances': '#84cc16',
  'Others': '#06b6d4',
  'Total': '#3b82f6',
  'Unknown': '#94a3b8',
  'GuardDuty': '#4ade80', // Light green
  'AmazonCloudWatch': '#0ea5e9', // Sky blue
  'Detective': '#a78bfa', // Lavender
  'Key Management Service': '#fb7185', // Rose
  'Secrets Manager': '#fbbf24', // Sunny yellow
  'global': '#34d399', // Emerald
  'Route 53': '#f472b6', // Hot pink
  'S3': '#06b6d4', // Cyan
  'EC2 Container Registry': '#8b5cf6', // Purple
  'DynamoDB': '#f59e0b', // Amber
  'Cost Explorer': '#10b981', // Emerald
  'CloudWatch Events': '#6366f1' // Indigo
};

// Account colors for when grouping by account
const ACCOUNT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
  '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'
];

// Nature-inspired fallback colors for unknown services
const NATURE_COLORS = [
  '#22c55e', // Forest green
  '#4ade80', // Light green
  '#34d399', // Emerald
  '#0ea5e9', // Sky blue
  '#06b6d4', // Cyan
  '#a78bfa', // Lavender
  '#fb7185', // Rose
  '#fbbf24', // Sunny yellow
  '#f472b6', // Hot pink
  '#6366f1', // Indigo
  '#10b981', // Emerald green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#84cc16', // Lime
  '#14b8a6', // Teal
  '#f43f5e', // Pink
  '#64748b', // Slate
  '#6b7280', // Gray
  '#dc2626', // Red 600
  '#7c3aed', // Violet
  '#059669', // Emerald 600
  '#db2777'  // Pink 600
];

// Function to get color for a service
const getServiceColor = (serviceName: string, index: number) => {
  // Ensure we always return a valid color
  const color = AWS_SERVICE_COLORS[serviceName] || NATURE_COLORS[Math.abs(index) % NATURE_COLORS.length];
  console.log(`Color assignment for "${serviceName}" (index ${index}):`, color);
  return color;
};

// Service name mapping for cleaner display
const SERVICE_NAME_MAP: { [key: string]: string } = {
  'Amazon Relational Database Service': 'Relational Database Service',
  'Amazon Elastic Compute Cloud - Compute': 'EC2-Instances',
  'Amazon Elastic Compute Cloud': 'EC2-Other',
  'EC2 - Other': 'EC2-Other',
  'Amazon Virtual Private Cloud': 'VPC',
  'AWS Config': 'Config',
  'Amazon Elastic Container Service': 'Elastic Container Service',
  'AWS Security Hub': 'Security Hub',
  'AWS CloudTrail': 'CloudTrail',
  'Elastic Load Balancing': 'Elastic Load Balancing',
  'Amazon CloudWatch': 'CloudWatch',
  'Amazon GuardDuty': 'GuardDuty',
  'AWS Key Management Service': 'Key Management Service',
  'AWS Secrets Manager': 'Secrets Manager',
  'AWS Cost Explorer': 'Cost Explorer',
  'Amazon EC2 Container Registry (ECR)': 'EC2 Container Registry',
  'Amazon Route 53': 'Route 53',
  'Amazon Simple Storage Service': 'S3',
  'Amazon DynamoDB': 'DynamoDB',
  'CloudWatch Events': 'CloudWatch Events',
  'AWS Lambda': 'Lambda',
  'Amazon Detective': 'Detective'
};

// Custom tooltip component for AWS Cost Explorer style
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg text-sm min-w-[200px]">
        <p className="font-medium mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }}></div>
                <span className="text-xs">{entry.dataKey}</span>
              </div>
              <span className="text-xs font-medium">${Number(entry.value).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-1 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Total:</span>
              <span className="text-xs font-bold">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CostTrendTab: React.FC = () => {
  // Default to last 30 days for cost analysis
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [groupBy, setGroupBy] = useState<'Service' | 'Account' | 'Region'>('Service');
  const [granularity, setGranularity] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [chartStyle, setChartStyle] = useState<'bar' | 'line' | 'pie'>('bar');
  
  // Get organizations using React Query
  const { data: organizations, isLoading: organizationsLoading } = useOrganizations();
  
  // Use the first organization the user has access to
  const organizationId = organizations && organizations.length > 0 ? organizations[0].id : null;
  
  // Sync functionality
  const syncCostData = useSyncCostData();
  const { data: syncStatus, isLoading: syncStatusLoading } = useSyncStatus(organizationId);
  
  // Map frontend groupBy values to backend expected values
  const groupByMapping = {
    'Service': 'service_name',
    'Account': 'account',
    'Region': 'region'
  };

  // Fetch cost trend data
  const { 
    data: costTrendResponse, 
    isLoading: isLoadingCostTrend, 
    error: costTrendError,
    refetch: refetchCostTrend
  } = useCostTrendWithForecast(
    organizationId,
    startDate,
    endDate,
    granularity,
    undefined,
    groupByMapping[groupBy],
    { includeForecast: false }
  );
  
  // Process data for AWS Cost Explorer style stacked bar chart
  const processedData = useMemo(() => {
    if (!costTrendResponse?.costTrend || costTrendResponse.costTrend.length === 0) {
      return {
        chartData: [],
        totalCost: 0,
        averageDailyCost: 0,
        serviceCount: 0,
        serviceBreakdown: []
      };
    }

    // Debug: Log what we're receiving
    console.log('Cost Trend Response:', {
      organizationId,
      groupBy,
      groupByMapped: groupByMapping[groupBy],
      dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      dataLength: costTrendResponse.costTrend.length,
      totalCostSum: costTrendResponse.costTrend.reduce((sum, item) => sum + item.cost, 0),
      sampleData: costTrendResponse.costTrend.slice(0, 5),
      sampleDataKeys: costTrendResponse.costTrend.length > 0 ? Object.keys(costTrendResponse.costTrend[0]) : [],
      accounts: costTrendResponse.accounts,
      uniqueServices: [...new Set(costTrendResponse.costTrend.map(item => item.service_name))].filter(Boolean),
      uniqueRegions: [...new Set(costTrendResponse.costTrend.map(item => item.region || item.service_name))].filter(Boolean),
      uniqueAccounts: [...new Set(costTrendResponse.costTrend.map(item => item.account_name || item.account_id))].filter(Boolean),
      regionData: groupBy === 'Region' ? costTrendResponse.costTrend.map(item => ({
        date: item.date,
        service_name: item.service_name,
        region: item.region,
        cost: item.cost
      })) : 'N/A'
    });
    
    // No account lookup needed - using account IDs directly

    // Group data by date and grouping dimension
    const dataByDate: { [date: string]: { [group: string]: number } } = {};
    const groupsSet = new Set<string>();
    let totalCost = 0;

    costTrendResponse.costTrend.forEach(item => {
      const date = new Date(item.date);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      const dateKey = `${month}-${day.toString().padStart(2, '0')}*`;
      
      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = { fullDate: item.date };
      }
      
      // Get the grouping key based on groupBy parameter
      let groupingKey = 'Unknown';
      
      // Define region pattern once for both cases
      const regionPattern = /^(us|eu|ap|sa|ca|me|af)-(east|west|north|south|central|northeast|southeast)-\d+$/;
      
      switch (groupBy) {
        case 'Service':
          // Use service_name for service grouping
          groupingKey = SERVICE_NAME_MAP[item.service_name || ''] || item.service_name || 'Unknown';
          
          // Skip items without service names for service grouping
          if (!item.service_name) return;
          
          // Additional safeguard: Filter out region names from service results
          if (regionPattern.test(groupingKey)) {
            console.log(`Filtering out region name from service grouping: ${groupingKey}`);
            return;
          }
          
          // Also filter out common region codes
          const commonRegions = [
            'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
            'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
            'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
            'ap-south-1', 'ap-east-1', 'ca-central-1', 'sa-east-1'
          ];
          if (commonRegions.includes(groupingKey)) {
            console.log(`Filtering out common region code from service grouping: ${groupingKey}`);
            return;
          }
          break;
          
        case 'Region':
          // For region grouping, backend maps region to result.region field
          groupingKey = item.region || 'Unknown Region';
          
          // Skip if no valid region data
          if (!groupingKey || groupingKey === 'Unknown Region') {
            console.log(`Skipping entry with no region data: region="${item.region}", cost: ${item.cost}`);
            return;
          }
          
          console.log(`Region entry: "${groupingKey}", cost: ${item.cost}`);
          break;
          
        case 'Account':
          // Use account_id directly for reliable identification
          if (item.account_id) {
            groupingKey = item.account_id;
          } else {
            groupingKey = 'Unknown Account';
          }
          break;
          
        default:
          groupingKey = 'Total';
      }
      
      // Skip entries we don't want to display
      if (groupingKey === 'Total' || !groupingKey || groupingKey === 'Unknown') {
        console.log(`Skipping entry with groupingKey: "${groupingKey}", service_name: "${item.service_name}", cost: ${item.cost}`);
        return;
      }
      
      // Debug log for each service being added
      if (groupBy === 'Service') {
        console.log(`Adding service: "${groupingKey}", original: "${item.service_name}", cost: ${item.cost}`);
      }
      
      groupsSet.add(groupingKey);
      dataByDate[dateKey][groupingKey] = (dataByDate[dateKey][groupingKey] || 0) + item.cost;
      totalCost += item.cost;
    });

    // Convert to chart format
    const chartData = Object.entries(dataByDate).map(([dateKey, data]) => {
      const { fullDate, ...groups } = data;
      const dataPoint: any = { 
        name: dateKey, 
        date: fullDate,
        fullDate: fullDate 
      };
      
      Object.entries(groups).forEach(([group, cost]) => {
        if (typeof cost === 'number') {
          dataPoint[group] = cost;
        }
      });
      
      return dataPoint;
    }).sort((a, b) => {
      // Sort by actual date
      const dateA = new Date(a.fullDate);
      const dateB = new Date(b.fullDate);
      return dateA.getTime() - dateB.getTime();
    });

    // Calculate stats
    const dayCount = chartData.length || 1;
    const averageDailyCost = totalCost / dayCount;
    const groupCount = groupsSet.size;

    // Group breakdown for legend
    const groupBreakdown = Array.from(groupsSet).map((group, index) => {
      let color;
      if (groupBy === 'Account') {
        color = ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
      } else {
        color = getServiceColor(group, index);
      }
      
      // Validate color to prevent black areas in legend
      const validColor = color && color !== '#000000' && color !== 'black' 
        ? color 
        : NATURE_COLORS[index % NATURE_COLORS.length];
      
      const total = chartData.reduce((sum, item) => sum + (item[group] || 0), 0);
      
      console.log(`Service "${group}" - Color: ${validColor}, Total: $${total.toFixed(2)}`);
      
      return {
        name: group,
        color: validColor,
        total
      };
    }).sort((a, b) => b.total - a.total);

    console.log('Processed Chart Data:', {
      chartDataLength: chartData.length,
      firstChartEntry: chartData[0],
      groupsFound: Array.from(groupsSet),
      totalCostCalculated: totalCost,
      groupCount,
      sampleChartData: chartData.slice(0, 2),
      allServiceColors: groupBreakdown.map(service => ({
        name: service.name,
        color: service.color,
        total: service.total
      }))
    });

    return {
      chartData,
      totalCost,
      averageDailyCost,
      serviceCount: groupCount, // Keep the same name for the stats card
      serviceBreakdown: groupBreakdown,
      services: Array.from(groupsSet) // Keep the same name for the chart rendering
    };
  }, [costTrendResponse]);

  const { chartData, totalCost, averageDailyCost, serviceCount, serviceBreakdown, services } = processedData;

  // Function to render different chart types
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    };

    // Define gradients for bars - using consistent green theme for all groupings
    const barGradients = services.map((service, index) => {
      const baseColor = '#10b981'; // Always use emerald green for consistency
      
      return (
        <defs key={`gradient-${service}`}>
          <linearGradient id={`gradient-${service}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={baseColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor={baseColor} stopOpacity="0.8" />
          </linearGradient>
        </defs>
      );
    });

    switch (chartStyle) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#666' }} 
              tickLine={false} 
              axisLine={{ stroke: '#e0e0e0' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
              tick={{ fontSize: 12, fill: '#666' }} 
              tickLine={false} 
              axisLine={false}
              domain={['dataMin - 10', 'dataMax + 10']}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            {services.map((service, index) => {
              const color = groupBy === 'Account' 
                ? ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]
                : getServiceColor(service, index);
              
              // Validate color for line chart
              const validColor = color && color !== '#000000' && color !== 'black' 
                ? color 
                : NATURE_COLORS[index % NATURE_COLORS.length];
              
              return (
                <Line
                  key={service}
                  type="monotone"
                  dataKey={service}
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              );
            })}
          </LineChart>
        );

      case 'pie':
        // For pie chart, we need to aggregate total costs by service
        const pieData = serviceBreakdown.map(service => ({
          name: service.name,
          value: service.total,
          color: service.color,
          percentage: ((service.total / totalCost) * 100).toFixed(1)
        }));
        
        return (
          <PieChart {...commonProps} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={140}
              paddingAngle={1}
              dataKey="value"
              stroke="#fff"
              strokeWidth={2}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [
                `$${value.toFixed(2)} (${((value / totalCost) * 100).toFixed(1)}%)`, 
                name
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </PieChart>
        );

      case 'bar':
      default:
        return (
          <BarChart
            {...commonProps}
            barCategoryGap="10%"
          >
            {barGradients}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#666' }} 
              tickLine={false} 
              axisLine={{ stroke: '#e0e0e0' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
              tick={{ fontSize: 12, fill: '#666' }} 
              tickLine={false} 
              axisLine={false}
              domain={['dataMin - 10', 'dataMax + 10']}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            {services.map((service, index) => {
              return (
                <Bar 
                  key={service}
                  dataKey={service}
                  stackId="cost"
                  fill={`url(#gradient-${service})`}
                />
              );
            })}
          </BarChart>
        );
    }
  };

  // Handle manual cost data sync
  const handleSyncCostData = async () => {
    if (!organizationId) {
      toast({
        title: "Error",
        description: "No organization found to sync data for.",
        variant: "destructive",
      });
      return;
    }

    try {
      await syncCostData.mutateAsync({
        organizationId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        granularity: 'DAILY',
      });

      toast({
        title: "Success",
        description: "Cost data sync initiated successfully.",
      });
      
      // Refetch data after sync
      setTimeout(() => refetchCostTrend(), 2000);
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync cost data from AWS.",
        variant: "destructive",
      });
    }
  };

  const loading = organizationsLoading || isLoadingCostTrend;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cost and usage overview</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-transparent w-2/5"></div>
          <CardContent className="relative p-6 z-10">
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">TOTAL COST</p>
              <p className="text-4xl font-bold text-gray-900">
                ${totalCost.toFixed(2)}
              </p>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-green-600 font-medium">+2.1%</span>
                <span className="text-blue-500">from last period</span>
              </div>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-200/20"></div>
        </Card>
        
        <Card className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-transparent w-2/5"></div>
          <CardContent className="relative p-6 z-10">
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">AVERAGE DAILY COST</p>
              <p className="text-4xl font-bold text-gray-900">
                ${averageDailyCost.toFixed(2)}
              </p>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-green-600 font-medium">+1.8%</span>
                <span className="text-blue-500">from last period</span>
              </div>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-200/20"></div>
        </Card>
        
        <Card className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-transparent w-2/5"></div>
          <CardContent className="relative p-6 z-10">
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                {groupBy === 'Service' ? 'SERVICE COUNT' : 
                 groupBy === 'Region' ? 'REGION COUNT' : 
                 'ACCOUNT COUNT'}
              </p>
              <p className="text-4xl font-bold text-gray-900">
                {serviceCount}
              </p>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-green-600 font-medium">+5.2%</span>
                <span className="text-blue-500">from last period</span>
              </div>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-200/20"></div>
        </Card>
      </div>

      {/* Cost and Usage Graph */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-1">Cost and usage graph</h2>
                <p className="text-sm text-gray-600">Costs ($)</p>
              </div>
              
              {/* Report Parameters */}
              <div className="flex items-center gap-4">
                {/* Chart Style Toggle */}
                <div className="flex items-center border rounded-lg p-1 bg-gray-50">
                  <Button
                    variant={chartStyle === 'bar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChartStyle('bar')}
                    className={`h-8 px-2 ${
                      chartStyle === 'bar'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : ''
                    }`}
                  >
                    <BarChart3 size={16} />
                  </Button>
                  <Button
                    variant={chartStyle === 'line' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChartStyle('line')}
                    className={`h-8 px-2 ${
                      chartStyle === 'line'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : ''
                    }`}
                  >
                    <TrendingUp size={16} />
                  </Button>
                  <Button
                    variant={chartStyle === 'pie' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChartStyle('pie')}
                    className={`h-8 px-2 ${
                      chartStyle === 'pie'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : ''
                    }`}
                  >
                    <PieIcon size={16} />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <DateRangePicker 
                    startDate={startDate}
                    endDate={endDate}
                    onDateChange={(start, end) => {
                      setStartDate(start);
                      setEndDate(end);
                    }}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={granularity} onValueChange={(value: 'DAILY' | 'WEEKLY' | 'MONTHLY') => setGranularity(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={groupBy} onValueChange={(value: 'Service' | 'Account' | 'Region') => setGroupBy(value)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Service">Service</SelectItem>
                      <SelectItem value="Account">Account</SelectItem>
                      <SelectItem value="Region">Region</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleSyncCostData}
                  disabled={syncCostData.isPending}
                  size="sm"
                  className="border-none shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white hover:from-emerald-600 hover:via-green-600 hover:to-teal-600"
                >
                  {syncCostData.isPending ? (
                    <>
                      <RefreshCw size={18} className="animate-spin mr-2 text-white animate-pulse transition-all duration-300" />
                      <span className="text-white">Syncing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} className="mr-2 text-white transition-all duration-300 hover:rotate-45" />
                      <span className="text-white">Sync AWS Data</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin mr-2" />
                <span>Loading cost data...</span>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                No cost data available for the selected period.
                <Button 
                  onClick={handleSyncCostData}
                  disabled={syncCostData.isPending}
                  size="sm"
                  className="ml-4 border-none shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white hover:from-emerald-600 hover:via-green-600 hover:to-teal-600"
                >
                  {syncCostData.isPending ? (
                    <>
                      <RefreshCw size={18} className="animate-spin mr-2 text-white animate-pulse transition-all duration-300" />
                      <span className="text-white">Syncing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} className="mr-2 text-white transition-all duration-300 hover:rotate-45" />
                      <span className="text-white">Sync Data</span>
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                {/* Dynamic Chart Rendering */}
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                  </ResponsiveContainer>
                </div>

                {/* Enhanced Service Cost Analysis */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Service Cost Analysis</h3>
                    <div className="text-sm text-gray-500">
                      Daily Average: <span className="font-semibold text-gray-700">${averageDailyCost.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* Calculate preceding period and projections */}
                  {(() => {
                    const dayCount = chartData.length || 1;
                    const dailyAverage = totalCost / dayCount;
                    
                    // Calculate preceding period dates (same duration as current period)
                    const currentPeriodDuration = endDate.getTime() - startDate.getTime();
                    const precedingEndDate = new Date(startDate.getTime() - 1); // Day before current period starts
                    const precedingStartDate = new Date(precedingEndDate.getTime() - currentPeriodDuration);
                    
                    // TODO: Implement real preceding period data fetch
                    // This should call the same useCostTrendWithForecast hook with precedingStartDate and precedingEndDate
                    // For now, we'll calculate a mock preceding period cost
                    const precedingPeriodCost = totalCost * 0.85; // Mock: 15% lower than current
                    
                    // Calculate cost change percentage
                    const costChangePercent = precedingPeriodCost > 0 
                      ? ((totalCost - precedingPeriodCost) / precedingPeriodCost * 100)
                      : 0;
                    
                    console.log('Period Calculation:', {
                      currentPeriod: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
                      precedingPeriod: `${precedingStartDate.toISOString().split('T')[0]} to ${precedingEndDate.toISOString().split('T')[0]}`,
                      currentCost: totalCost,
                      precedingCost: precedingPeriodCost,
                      changePercent: costChangePercent
                    });
                    
                    const monthlyProjected = dailyAverage * 30;
                    const maxValue = Math.max(totalCost, precedingPeriodCost, monthlyProjected);
                    
                    const projectedBreakdown = serviceBreakdown.map(service => ({
                      ...service,
                      projectedTotal: (service.total / totalCost) * monthlyProjected
                    }));
                    
                    // Get organization name
                    const organizationName = organizations && organizations.length > 0 ? organizations[0].name : 'Organization';
                    const displayName = groupBy === 'Account' ? organizationName : 'All Services';
                    
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold text-gray-900">Cost breakdown</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Group by</span>
                            <select className="bg-white border border-gray-300 rounded px-3 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value={groupBy}>{groupBy}</option>
                            </select>
                          </div>
                        </div>

                        {/* Account/Service Name */}
                        <div className="mb-4">
                          <div className="text-base font-medium text-gray-900">{displayName}</div>
                        </div>

                        {/* Horizontal Bar Chart */}
                        <div className="mb-6">
                          <div className="relative">
                            <div className="h-10 bg-gray-200 rounded relative overflow-hidden">
                              {/* Preceding Period Bar (background) */}
                              <div 
                                className="absolute inset-y-0 left-0 rounded"
                                style={{ 
                                  width: `${Math.min((precedingPeriodCost / maxValue) * 100, 100)}%`,
                                  background: 'linear-gradient(to top, rgba(156, 163, 175, 0.7), rgba(156, 163, 175, 0.2))'
                                }}
                              ></div>
                              {/* Current Period Bar (foreground) */}
                              <div 
                                className="absolute inset-y-0 left-0 rounded"
                                style={{ 
                                  width: `${Math.min((totalCost / maxValue) * 100, 100)}%`,
                                  background: 'linear-gradient(to top, rgba(16, 185, 129, 0.8), rgba(16, 185, 129, 0.2))'
                                }}
                              ></div>
                            </div>
                            
                            {/* Scale Labels */}
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                              <span>$0.00</span>
                              <span>${(maxValue * 0.1).toFixed(2)}</span>
                              <span>${(maxValue * 0.2).toFixed(2)}</span>
                              <span>${(maxValue * 0.3).toFixed(2)}</span>
                              <span>${(maxValue * 0.4).toFixed(2)}</span>
                              <span>${(maxValue * 0.5).toFixed(2)}</span>
                              <span>${(maxValue * 0.6).toFixed(2)}</span>
                              <span>${(maxValue * 0.7).toFixed(2)}</span>
                              <span>${(maxValue * 0.8).toFixed(2)}</span>
                              <span>${(maxValue * 0.9).toFixed(2)}</span>
                              <span>${maxValue.toFixed(2)}</span>
                            </div>
                            
                            {/* Legend */}
                            <div className="flex items-center gap-6 mt-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Current period</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                <span className="text-sm text-gray-600">Preceding period</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Breakdown Table */}
                        <div className="border-t border-gray-200 pt-6">
                          <div className="grid grid-cols-5 gap-4 mb-4">
                            <div className="text-sm font-medium text-gray-600">Group by</div>
                            <div className="text-sm font-medium text-gray-600 text-center">Costs</div>
                            <div className="text-sm font-medium text-gray-600 text-center">Savings</div>
                            <div className="text-sm font-medium text-gray-600 text-center">Utilization</div>
                            <div className="text-sm font-medium text-gray-600 text-center">Resources</div>
                          </div>
                          
                          {/* Main Row */}
                          <div className="grid grid-cols-5 gap-4 py-4 border-b border-gray-100">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-emerald-600">
                                {displayName}
                              </span>
                            </div>
                            
                            {/* Costs Column */}
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-sm">
                                <div className={`w-2 h-2 rounded-full ${costChangePercent >= 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                <span className={`font-medium ${costChangePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {costChangePercent >= 0 ? '+' : ''}{costChangePercent.toFixed(0)}%
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                ${precedingPeriodCost.toFixed(2)} → ${totalCost.toFixed(2)}
                              </div>
                            </div>
                            
                            {/* Savings Column */}
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-900">0%</div>
                              <div className="text-xs text-gray-500 mt-1">$0.00 → $0.00</div>
                            </div>
                            
                            {/* Utilization Column */}
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-sm">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-red-600 font-medium">-3%</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">7.61% → 7.40%</div>
                            </div>
                            
                            {/* Resources Column */}
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-900">0%</div>
                              <div className="text-xs text-gray-500 mt-1">{serviceCount} → {serviceCount}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Service Legend */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">Service Legend</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {serviceBreakdown.slice(0, 8).map((service) => (
                        <div key={service.name} className="flex items-center gap-2 text-xs">
                          <div 
                            className="w-3 h-3 rounded-sm flex-shrink-0" 
                            style={{ backgroundColor: service.color }}
                          ></div>
                          <span className="text-gray-700 truncate" title={service.name}>
                            {service.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostTrendTab;