import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Info, 
  DollarSign, 
  TrendingDown, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Grid3x3,
  List,
  Layers,
  Zap,
  Trash2,
  Tag,
  Pause,
  BarChart3,
  Eye,
  EyeOff
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface Recommendation {
  id: string;
  resourceId: string;
  resourceType: string;
  resourceName: string;
  recommendationType: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedMonthlySavings: number;
  estimatedYearlySavings: number;
  implementationEffort: 'easy' | 'moderate' | 'complex';
  priority: number;
  category: string;
  currentCost?: number;
  optimizedCost?: number;
}

interface SmartRecommendationsGroupedProps {
  resources: any[];
  costData?: any;
  filters: {
    resourceType: string[];
    costPriority?: string[];
    status: string[];
  };
  includeIgnored: boolean;
  onToggleIgnored: (value: boolean) => void;
}

type ViewMode = 'grid' | 'list' | 'compact';

export function SmartRecommendationsGrouped({ 
  resources, 
  costData,
  filters,
  includeIgnored,
  onToggleIgnored
}: SmartRecommendationsGroupedProps) {
  
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Rightsizing']));
  const [showAllInCategory, setShowAllInCategory] = useState<Set<string>>(new Set());
  
  // Generate recommendations (same logic as before)
  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    
    resources.forEach(resource => {
      const resourceType = resource.resource_type || '';
      const isEC2Instance = resourceType.includes('Instance') || resourceType === 'EC2';
      const isEBSVolume = resourceType.includes('Volume') || resourceType === 'EBS';
      const isRDS = resourceType.includes('RDS') || resourceType.includes('DBInstance');
      const isS3 = resourceType.includes('S3') || resourceType.includes('Bucket');
      const isELB = resourceType.includes('LoadBalancer') || resourceType === 'ELB';
      const isNAT = resourceType.includes('NatGateway') || resourceType === 'NAT';
      
      // Unattached EBS Volumes
      if (isEBSVolume && (!resource.metadata?.attachments || resource.metadata?.attachments?.length === 0)) {
        const volumeSize = resource.metadata?.size || 100;
        const volumeType = resource.metadata?.volumeType || 'gp3';
        const monthlyCost = volumeSize * (volumeType === 'io1' ? 0.125 : 0.08);
        
        recs.push({
          id: `rec-${resource.id}-unattached`,
          resourceId: resource.id,
          resourceType: 'EBS',
          resourceName: resource.resource_name || resource.resource_id_on_provider,
          recommendationType: 'unused',
          description: `EBS volume ${resource.resource_id_on_provider} is unattached and can be deleted or snapshot`,
          impact: monthlyCost > 50 ? 'high' : monthlyCost > 20 ? 'medium' : 'low',
          estimatedMonthlySavings: monthlyCost,
          estimatedYearlySavings: monthlyCost * 12,
          implementationEffort: 'easy',
          priority: Math.min(100, Math.round((monthlyCost / 100) * 100)),
          category: 'Unused Resources',
          currentCost: monthlyCost,
          optimizedCost: 0
        });
      }
      
      // EC2 Instance Recommendations
      if (isEC2Instance) {
        const instanceType = resource.metadata?.instanceType || 't2.micro';
        const cpuUtilization = resource.metadata?.monitoring?.cpuUtilization || Math.random() * 30;
        const hasReservedInstance = resource.metadata?.reservedInstance || false;
        
        if (cpuUtilization < 30 || !resource.metadata?.monitoring) {
          const estimatedCost = getEC2MonthlyCost(instanceType);
          const downsizedCost = estimatedCost * (cpuUtilization < 10 ? 0.5 : 0.7);
          
          recs.push({
            id: `rec-${resource.id}-rightsize`,
            resourceId: resource.id,
            resourceType: 'EC2',
            resourceName: resource.resource_name || resource.resource_id_on_provider,
            recommendationType: 'rightsize',
            description: `EC2 instance has ${cpuUtilization < 10 ? 'very low' : 'low'} CPU utilization (${cpuUtilization.toFixed(1)}%). Consider downsizing from ${instanceType}`,
            impact: estimatedCost > 100 ? 'high' : estimatedCost > 50 ? 'medium' : 'low',
            estimatedMonthlySavings: estimatedCost - downsizedCost,
            estimatedYearlySavings: (estimatedCost - downsizedCost) * 12,
            implementationEffort: 'moderate',
            priority: Math.min(100, Math.round(((estimatedCost - downsizedCost) / 200) * 100)),
            category: 'Rightsizing',
            currentCost: estimatedCost,
            optimizedCost: downsizedCost
          });
        }
        
        if (!hasReservedInstance) {
          const estimatedCost = getEC2MonthlyCost(instanceType);
          const reservedCost = estimatedCost * 0.3;
          
          recs.push({
            id: `rec-${resource.id}-reserved`,
            resourceId: resource.id,
            resourceType: 'EC2',
            resourceName: resource.resource_name || resource.resource_id_on_provider,
            recommendationType: 'optimize',
            description: `Purchase Reserved Instance for ${instanceType} to save ~70% on compute costs`,
            impact: estimatedCost > 100 ? 'high' : 'medium',
            estimatedMonthlySavings: reservedCost,
            estimatedYearlySavings: reservedCost * 12,
            implementationEffort: 'easy',
            priority: Math.min(100, Math.round((reservedCost / 150) * 100)),
            category: 'Cost Optimization',
            currentCost: estimatedCost,
            optimizedCost: estimatedCost - reservedCost
          });
        }
      }
      
      // RDS Instance Recommendations
      if (isRDS) {
        const instanceClass = resource.metadata?.DBInstanceClass || 'db.t3.micro';
        const engine = resource.metadata?.Engine || 'mysql';
        const multiAZ = resource.metadata?.MultiAZ || false;
        const storageSize = resource.metadata?.AllocatedStorage || 100;
        const storageType = resource.metadata?.StorageType || 'gp2';
        
        const instanceCost = getRDSMonthlyCost(instanceClass, multiAZ);
        const storageCost = storageSize * (storageType === 'io1' ? 0.125 : 0.10);
        const totalCost = instanceCost + storageCost;
        
        const cpuUtilization = resource.metadata?.monitoring?.cpuUtilization || Math.random() * 25;
        if (cpuUtilization < 20) {
          const downsizedCost = totalCost * 0.6;
          
          recs.push({
            id: `rec-${resource.id}-rightsize`,
            resourceId: resource.id,
            resourceType: 'RDS',
            resourceName: resource.resource_name || resource.resource_id_on_provider,
            recommendationType: 'rightsize',
            description: `RDS ${engine} instance has low CPU utilization (${cpuUtilization.toFixed(1)}%). Consider downsizing from ${instanceClass}`,
            impact: totalCost > 150 ? 'high' : totalCost > 75 ? 'medium' : 'low',
            estimatedMonthlySavings: totalCost - downsizedCost,
            estimatedYearlySavings: (totalCost - downsizedCost) * 12,
            implementationEffort: 'moderate',
            priority: Math.min(100, Math.round(((totalCost - downsizedCost) / 250) * 100)),
            category: 'Rightsizing',
            currentCost: totalCost,
            optimizedCost: downsizedCost
          });
        }
      }
      
      // S3 Bucket Recommendations
      if (isS3) {
        const sizeBytes = resource.metadata?.Size || 0;
        const sizeGB = sizeBytes / (1024 * 1024 * 1024) || Math.random() * 1000;
        const storageClass = resource.metadata?.StorageClass || 'STANDARD';
        const lastAccessDate = resource.metadata?.LastAccessed;
        const daysSinceAccess = lastAccessDate ? 
          Math.floor((Date.now() - new Date(lastAccessDate).getTime()) / (1000 * 60 * 60 * 24)) : 
          90;
        
        const monthlyCost = sizeGB * (storageClass === 'STANDARD' ? 0.023 : 0.01);
        
        if (daysSinceAccess > 30 && storageClass === 'STANDARD' && sizeGB > 100) {
          const glacierCost = sizeGB * 0.004;
          
          recs.push({
            id: `rec-${resource.id}-lifecycle`,
            resourceId: resource.id,
            resourceType: 'S3',
            resourceName: resource.resource_name || resource.resource_id_on_provider,
            recommendationType: 'optimize',
            description: `Bucket has ${sizeGB.toFixed(0)}GB not accessed in ${daysSinceAccess} days. Move to Glacier for 80% savings`,
            impact: monthlyCost > 50 ? 'high' : monthlyCost > 20 ? 'medium' : 'low',
            estimatedMonthlySavings: monthlyCost - glacierCost,
            estimatedYearlySavings: (monthlyCost - glacierCost) * 12,
            implementationEffort: 'easy',
            priority: Math.min(100, Math.round(((monthlyCost - glacierCost) / 100) * 100)),
            category: 'Cost Optimization',
            currentCost: monthlyCost,
            optimizedCost: glacierCost
          });
        }
      }
      
      // Load Balancer Recommendations
      if (isELB) {
        const targetCount = resource.metadata?.targetCount || 0;
        const lbType = resource.metadata?.Type || 'application';
        const activeConnectionCount = resource.metadata?.ActiveConnectionCount || Math.random() * 100;
        const processedBytes = resource.metadata?.ProcessedBytes || 0;
        const processedGB = processedBytes / (1024 * 1024 * 1024) || Math.random() * 500;
        
        const baseCost = lbType === 'network' ? 22.5 : 18;
        const dataTransferCost = processedGB * 0.008;
        const monthlyCost = baseCost + dataTransferCost;
        
        if (targetCount === 0 || activeConnectionCount < 10) {
          recs.push({
            id: `rec-${resource.id}-idle`,
            resourceId: resource.id,
            resourceType: 'ELB',
            resourceName: resource.resource_name || resource.resource_id_on_provider,
            recommendationType: 'idle',
            description: `${lbType} load balancer has ${targetCount} targets and minimal activity. Consider removal`,
            impact: monthlyCost > 30 ? 'high' : 'medium',
            estimatedMonthlySavings: monthlyCost,
            estimatedYearlySavings: monthlyCost * 12,
            implementationEffort: 'easy',
            priority: Math.min(100, Math.round((monthlyCost / 50) * 100)),
            category: 'Idle Resources',
            currentCost: monthlyCost,
            optimizedCost: 0
          });
        }
      }
      
      // Lambda Function Recommendations
      const isLambda = resourceType.includes('Lambda') || resourceType.includes('Function');
      if (isLambda) {
        const memorySize = resource.metadata?.MemorySize || 128;
        const invocations = resource.metadata?.Invocations || Math.random() * 100000;
        const averageDuration = resource.metadata?.AverageDuration || 100;
        
        const gbSeconds = (memorySize / 1024) * (averageDuration / 1000) * invocations;
        const requestCost = (invocations / 1000000) * 0.20;
        const computeCost = gbSeconds * 0.0000166667;
        const monthlyCost = requestCost + computeCost;
        
        const memoryUtilization = resource.metadata?.MemoryUtilization || 40;
        if (memoryUtilization < 50 && memorySize > 256) {
          const optimizedMemory = memorySize * 0.5;
          const optimizedGbSeconds = (optimizedMemory / 1024) * (averageDuration / 1000) * invocations;
          const optimizedComputeCost = optimizedGbSeconds * 0.0000166667;
          const savings = computeCost - optimizedComputeCost;
          
          if (savings > 5) {
            recs.push({
              id: `rec-${resource.id}-memory`,
              resourceId: resource.id,
              resourceType: 'Lambda',
              resourceName: resource.resource_name || resource.resource_id_on_provider,
              recommendationType: 'rightsize',
              description: `Lambda function uses only ${memoryUtilization}% of ${memorySize}MB. Reduce to ${optimizedMemory}MB`,
              impact: savings > 50 ? 'high' : savings > 20 ? 'medium' : 'low',
              estimatedMonthlySavings: savings,
              estimatedYearlySavings: savings * 12,
              implementationEffort: 'easy',
              priority: Math.min(100, Math.round((savings / 100) * 100)),
              category: 'Rightsizing',
              currentCost: monthlyCost,
              optimizedCost: requestCost + optimizedComputeCost
            });
          }
        }
      }
      
      // NAT Gateway Recommendations
      if (isNAT) {
        const hoursActive = resource.metadata?.HoursActive || 730;
        const dataProcessedGB = resource.metadata?.BytesProcessed ? 
          resource.metadata.BytesProcessed / (1024 * 1024 * 1024) : 100;
        const connectionsCount = resource.metadata?.ActiveConnectionCount || Math.random() * 1000;
        
        const hourlyCost = 0.045;
        const baseCost = hourlyCost * hoursActive;
        const dataCost = dataProcessedGB * 0.045;
        const totalCost = baseCost + dataCost;
        
        if (dataProcessedGB < 500 && connectionsCount < 1000) {
          const natInstanceCost = totalCost * 0.4;
          
          recs.push({
            id: `rec-${resource.id}-nat-instance`,
            resourceId: resource.id,
            resourceType: 'NAT',
            resourceName: resource.resource_name || resource.resource_id_on_provider,
            recommendationType: 'optimize',
            description: `Low traffic NAT Gateway (${dataProcessedGB.toFixed(0)}GB/mo). Switch to NAT instance for 60% savings`,
            impact: totalCost > 100 ? 'high' : 'medium',
            estimatedMonthlySavings: totalCost - natInstanceCost,
            estimatedYearlySavings: (totalCost - natInstanceCost) * 12,
            implementationEffort: 'complex',
            priority: Math.min(100, Math.round(((totalCost - natInstanceCost) / 200) * 100)),
            category: 'Cost Optimization',
            currentCost: totalCost,
            optimizedCost: natInstanceCost
          });
        }
      }
      
      // DynamoDB Table Recommendations
      const isDynamoDB = resourceType.includes('DynamoDB') || resourceType.includes('Table');
      if (isDynamoDB) {
        const billingMode = resource.metadata?.BillingMode || 'PROVISIONED';
        const readCapacity = resource.metadata?.ProvisionedThroughput?.ReadCapacityUnits || 5;
        const writeCapacity = resource.metadata?.ProvisionedThroughput?.WriteCapacityUnits || 5;
        const consumedRead = resource.metadata?.ConsumedReadCapacityUnits || 1;
        const consumedWrite = resource.metadata?.ConsumedWriteCapacityUnits || 1;
        
        const monthlyCost = billingMode === 'PROVISIONED' ?
          (readCapacity * 0.00013 + writeCapacity * 0.00065) * 730 :
          50;
        
        if (billingMode === 'PROVISIONED') {
          const readUtilization = (consumedRead / readCapacity) * 100;
          const writeUtilization = (consumedWrite / writeCapacity) * 100;
          
          if (readUtilization < 30 || writeUtilization < 30) {
            const optimizedRead = Math.max(1, Math.ceil(consumedRead * 1.5));
            const optimizedWrite = Math.max(1, Math.ceil(consumedWrite * 1.5));
            const optimizedCost = (optimizedRead * 0.00013 + optimizedWrite * 0.00065) * 730;
            
            recs.push({
              id: `rec-${resource.id}-capacity`,
              resourceId: resource.id,
              resourceType: 'DynamoDB',
              resourceName: resource.resource_name || resource.resource_id_on_provider,
              recommendationType: 'rightsize',
              description: `Table has low utilization (Read: ${readUtilization.toFixed(1)}%, Write: ${writeUtilization.toFixed(1)}%). Reduce capacity`,
              impact: monthlyCost > 50 ? 'high' : monthlyCost > 20 ? 'medium' : 'low',
              estimatedMonthlySavings: monthlyCost - optimizedCost,
              estimatedYearlySavings: (monthlyCost - optimizedCost) * 12,
              implementationEffort: 'easy',
              priority: Math.min(100, Math.round(((monthlyCost - optimizedCost) / 100) * 100)),
              category: 'Rightsizing',
              currentCost: monthlyCost,
              optimizedCost: optimizedCost
            });
          }
        }
      }
      
      // ElastiCache Recommendations
      const isElastiCache = resourceType.includes('ElastiCache') || resourceType.includes('CacheCluster');
      if (isElastiCache) {
        const nodeType = resource.metadata?.CacheNodeType || 'cache.t3.micro';
        const numNodes = resource.metadata?.NumCacheNodes || 1;
        const engine = resource.metadata?.Engine || 'redis';
        const cpuUtilization = resource.metadata?.CPUUtilization || 15;
        const memoryUtilization = resource.metadata?.DatabaseMemoryUsagePercentage || 20;
        
        const nodeCost = getElastiCacheMonthlyCost(nodeType);
        const monthlyCost = nodeCost * numNodes;
        
        if ((cpuUtilization < 20 || memoryUtilization < 30) && nodeType !== 'cache.t3.micro') {
          const downsizedCost = monthlyCost * 0.5;
          
          recs.push({
            id: `rec-${resource.id}-rightsize`,
            resourceId: resource.id,
            resourceType: 'ElastiCache',
            resourceName: resource.resource_name || resource.resource_id_on_provider,
            recommendationType: 'rightsize',
            description: `${engine} cache has low utilization (CPU: ${cpuUtilization}%, Memory: ${memoryUtilization}%). Downsize from ${nodeType}`,
            impact: monthlyCost > 100 ? 'high' : monthlyCost > 50 ? 'medium' : 'low',
            estimatedMonthlySavings: monthlyCost - downsizedCost,
            estimatedYearlySavings: (monthlyCost - downsizedCost) * 12,
            implementationEffort: 'moderate',
            priority: Math.min(100, Math.round(((monthlyCost - downsizedCost) / 150) * 100)),
            category: 'Rightsizing',
            currentCost: monthlyCost,
            optimizedCost: downsizedCost
          });
        }
      }
    });
    
    // Apply filters
    let filteredRecs = recs;
    if (filters.resourceType.length > 0) {
      filteredRecs = filteredRecs.filter(rec => {
        return filters.resourceType.some(filterType => {
          switch(filterType) {
            case 'EC2': return rec.resourceType === 'EC2';
            case 'EBS': return rec.resourceType === 'EBS';
            case 'RDS': return rec.resourceType === 'RDS';
            case 'S3': return rec.resourceType === 'S3';
            case 'Lambda': return rec.resourceType === 'Lambda';
            case 'ELB': return rec.resourceType === 'ELB';
            case 'NAT': return rec.resourceType === 'NAT';
            case 'DynamoDB': return rec.resourceType === 'DynamoDB';
            case 'ElastiCache': return rec.resourceType === 'ElastiCache';
            default: return rec.resourceType === filterType;
          }
        });
      });
    }
    
    if (filters.costPriority && filters.costPriority.length > 0) {
      filteredRecs = filteredRecs.filter(rec => {
        if (filters.costPriority!.includes('high') && rec.estimatedMonthlySavings > 100) return true;
        if (filters.costPriority!.includes('medium') && rec.estimatedMonthlySavings >= 20 && rec.estimatedMonthlySavings <= 100) return true;
        if (filters.costPriority!.includes('low') && rec.estimatedMonthlySavings < 20) return true;
        return false;
      });
    }
    
    return filteredRecs.sort((a, b) => b.estimatedMonthlySavings - a.estimatedMonthlySavings);
  }, [resources, filters]);
  
  // Group recommendations by category
  const groupedRecommendations = useMemo(() => {
    const groups: Record<string, {
      recommendations: Recommendation[];
      totalSavings: number;
      count: number;
      icon: React.ReactNode;
      color: string;
    }> = {};
    
    recommendations.forEach(rec => {
      if (!groups[rec.category]) {
        groups[rec.category] = {
          recommendations: [],
          totalSavings: 0,
          count: 0,
          icon: getCategoryIcon(rec.category),
          color: getCategoryColor(rec.category)
        };
      }
      groups[rec.category].recommendations.push(rec);
      groups[rec.category].totalSavings += rec.estimatedMonthlySavings;
      groups[rec.category].count++;
    });
    
    return groups;
  }, [recommendations]);
  
  const totalSavings = useMemo(() => {
    return recommendations.reduce((sum, rec) => sum + rec.estimatedMonthlySavings, 0);
  }, [recommendations]);
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };
  
  const toggleShowAll = (category: string) => {
    setShowAllInCategory(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };
  
  const getImpactColor = (impact: string) => {
    switch(impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getEffortColor = (effort: string) => {
    switch(effort) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'complex': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span>Smart Recommendations</span>
              <Info className="h-5 w-5 text-gray-500" />
            </h2>
            <div className="mt-1 flex items-center gap-4">
              <p className="text-sm text-gray-600">
                {recommendations.length} recommendations across {Object.keys(groupedRecommendations).length} categories
              </p>
              {totalSavings > 0 && (
                <p className="text-sm font-bold text-green-600">
                  Potential savings: ${totalSavings.toFixed(2)}/mo (${(totalSavings * 12).toFixed(2)}/yr)
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="h-7 px-2"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="h-7 px-2"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'compact' ? 'default' : 'ghost'}
                onClick={() => setViewMode('compact')}
                className="h-7 px-2"
              >
                <Layers className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 border-l pl-3">
              <Switch 
                id="include-ignored" 
                checked={includeIgnored} 
                onCheckedChange={onToggleIgnored}
              />
              <label htmlFor="include-ignored" className="text-sm font-medium text-gray-700 cursor-pointer">
                Include ignored
              </label>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {resources.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium text-lg">No resources discovered yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Use the "Discover Resources" button above to sync resources from your AWS account.
              <br />
              Once resources are discovered, recommendations will appear here automatically.
            </p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No recommendations found based on current filters</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or selecting "All Resources"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedRecommendations).map(([category, data]) => (
              <Collapsible
                key={category}
                open={expandedCategories.has(category)}
              >
                <Card className={cn(
                  "border transition-all duration-200",
                  expandedCategories.has(category) ? data.color.replace('bg-', 'border-').replace('-100', '-300') : 'border-gray-200'
                )}>
                  <CollapsibleTrigger
                    onClick={() => toggleCategory(category)}
                    className="w-full"
                  >
                    <div className={cn(
                      "flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer rounded-t-lg",
                      expandedCategories.has(category) && data.color.replace('-800', '-50').replace('text', 'bg')
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", data.color.replace('text', 'bg'))}>
                          {data.icon}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900">{category}</h3>
                          <p className="text-sm text-gray-600">
                            {data.count} {data.count === 1 ? 'recommendation' : 'recommendations'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Potential Savings</p>
                          <p className="font-bold text-green-600">
                            ${data.totalSavings.toFixed(2)}/mo
                          </p>
                        </div>
                        {expandedCategories.has(category) ? 
                          <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        }
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t border-gray-100 p-4">
                      {viewMode === 'compact' ? (
                        <CompactView 
                          recommendations={data.recommendations} 
                          showAll={showAllInCategory.has(category)}
                          onToggleShowAll={() => toggleShowAll(category)}
                        />
                      ) : viewMode === 'list' ? (
                        <ListView 
                          recommendations={data.recommendations}
                          showAll={showAllInCategory.has(category)}
                          onToggleShowAll={() => toggleShowAll(category)}
                        />
                      ) : (
                        <GridView 
                          recommendations={data.recommendations}
                          showAll={showAllInCategory.has(category)}
                          onToggleShowAll={() => toggleShowAll(category)}
                          getImpactColor={getImpactColor}
                          getEffortColor={getEffortColor}
                        />
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact View Component
function CompactView({ 
  recommendations, 
  showAll, 
  onToggleShowAll 
}: { 
  recommendations: Recommendation[]; 
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  const displayRecs = showAll ? recommendations : recommendations.slice(0, 5);
  
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 font-medium">Resource</th>
              <th className="pb-2 font-medium">Issue</th>
              <th className="pb-2 font-medium text-right">Monthly Savings</th>
              <th className="pb-2 font-medium text-center">Impact</th>
              <th className="pb-2 font-medium text-center">Effort</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayRecs.map((rec) => (
              <tr key={rec.id} className="hover:bg-gray-50">
                <td className="py-2">
                  <div className="font-medium text-gray-900 truncate max-w-xs">
                    {rec.resourceName}
                  </div>
                </td>
                <td className="py-2">
                  <div className="text-gray-600 truncate max-w-md">
                    {rec.description}
                  </div>
                </td>
                <td className="py-2 text-right">
                  <span className="font-semibold text-green-600">
                    ${rec.estimatedMonthlySavings.toFixed(2)}
                  </span>
                </td>
                <td className="py-2 text-center">
                  <Badge variant="secondary" className={cn("text-xs", 
                    rec.impact === 'high' ? 'bg-red-100 text-red-700' :
                    rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  )}>
                    {rec.impact}
                  </Badge>
                </td>
                <td className="py-2 text-center">
                  <Badge variant="secondary" className={cn("text-xs",
                    rec.implementationEffort === 'complex' ? 'bg-red-100 text-red-700' :
                    rec.implementationEffort === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  )}>
                    {rec.implementationEffort}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {recommendations.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleShowAll}
          className="w-full mt-2 text-blue-600 hover:text-blue-800"
        >
          {showAll ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show All {recommendations.length} Recommendations
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// List View Component
function ListView({ 
  recommendations, 
  showAll,
  onToggleShowAll 
}: { 
  recommendations: Recommendation[];
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  const displayRecs = showAll ? recommendations : recommendations.slice(0, 5);
  
  return (
    <div className="space-y-3">
      {displayRecs.map((rec, index) => (
        <div key={rec.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
              {index + 1}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">{rec.resourceName}</h4>
              <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray-500">Current: ${rec.currentCost?.toFixed(2)}/mo</span>
                <span className="text-green-600 font-semibold">Save: ${rec.estimatedMonthlySavings.toFixed(2)}/mo</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn("text-xs",
              rec.impact === 'high' ? 'bg-red-100 text-red-700' :
              rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            )}>
              {rec.impact} impact
            </Badge>
            <Button size="sm" variant="outline">
              View Details
            </Button>
          </div>
        </div>
      ))}
      
      {recommendations.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleShowAll}
          className="w-full mt-2 text-blue-600 hover:text-blue-800"
        >
          {showAll ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show All {recommendations.length} Recommendations
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Grid View Component (existing card layout)
function GridView({ 
  recommendations, 
  showAll,
  onToggleShowAll,
  getImpactColor,
  getEffortColor
}: { 
  recommendations: Recommendation[];
  showAll: boolean;
  onToggleShowAll: () => void;
  getImpactColor: (impact: string) => string;
  getEffortColor: (effort: string) => string;
}) {
  const displayRecs = showAll ? recommendations : recommendations.slice(0, 6);
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayRecs.map((rec, index) => (
          <Card key={rec.id} className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-gray-500">#{index + 1}</span>
                <Badge className={getImpactColor(rec.impact)} variant="secondary">
                  {rec.impact} priority
                </Badge>
              </div>
              
              <h4 className="font-medium text-gray-900 mb-2 text-sm">
                {getRecommendationIcon(rec.recommendationType)}
                {rec.resourceName}
              </h4>
              
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                {rec.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Monthly Savings:</span>
                  <span className="font-bold text-green-600">
                    ${rec.estimatedMonthlySavings.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${getEffortColor(rec.implementationEffort)} text-xs`} variant="secondary">
                    {rec.implementationEffort} effort
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {recommendations.length > 6 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleShowAll}
          className="w-full mt-4 text-blue-600 hover:text-blue-800"
        >
          {showAll ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show All {recommendations.length} Recommendations
            </>
          )}
        </Button>
      )}
    </>
  );
}

// Helper functions
function getCategoryIcon(category: string) {
  switch(category) {
    case 'Rightsizing': return <BarChart3 className="h-5 w-5 text-blue-600" />;
    case 'Cost Optimization': return <Zap className="h-5 w-5 text-amber-600" />;
    case 'Unused Resources': return <Trash2 className="h-5 w-5 text-red-600" />;
    case 'Idle Resources': return <Pause className="h-5 w-5 text-orange-600" />;
    case 'Governance': return <Tag className="h-5 w-5 text-purple-600" />;
    default: return <Info className="h-5 w-5 text-gray-600" />;
  }
}

function getCategoryColor(category: string) {
  switch(category) {
    case 'Rightsizing': return 'bg-blue-100 text-blue-800';
    case 'Cost Optimization': return 'bg-amber-100 text-amber-800';
    case 'Unused Resources': return 'bg-red-100 text-red-800';
    case 'Idle Resources': return 'bg-orange-100 text-orange-800';
    case 'Governance': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getRecommendationIcon(type: string) {
  switch(type) {
    case 'unused': return '🗑️ ';
    case 'rightsize': return '📊 ';
    case 'idle': return '⏸️ ';
    case 'optimize': return '⚡ ';
    case 'governance': return '🏷️ ';
    default: return '';
  }
}

function getEC2MonthlyCost(instanceType: string): number {
  const costs: Record<string, number> = {
    't2.micro': 8.5,
    't2.small': 17,
    't2.medium': 34,
    't2.large': 68,
    't3.micro': 7.5,
    't3.small': 15,
    't3.medium': 30,
    't3.large': 60,
    'm5.large': 70,
    'm5.xlarge': 140,
    'm5.2xlarge': 280,
    'c5.large': 62,
    'c5.xlarge': 124,
    'r5.large': 92,
    'r5.xlarge': 184,
  };
  
  return costs[instanceType] || 50;
}

function getRDSMonthlyCost(instanceClass: string, multiAZ: boolean): number {
  const costs: Record<string, number> = {
    'db.t3.micro': 13,
    'db.t3.small': 26,
    'db.t3.medium': 52,
    'db.t3.large': 104,
    'db.t4g.micro': 11,
    'db.t4g.small': 22,
    'db.t4g.medium': 44,
    'db.t4g.large': 88,
    'db.m5.large': 125,
    'db.m5.xlarge': 250,
    'db.m5.2xlarge': 500,
    'db.m6i.large': 130,
    'db.m6i.xlarge': 260,
    'db.r5.large': 172,
    'db.r5.xlarge': 345,
    'db.r5.2xlarge': 690,
  };
  
  const baseCost = costs[instanceClass] || 100;
  return multiAZ ? baseCost * 2 : baseCost;
}

function getElastiCacheMonthlyCost(nodeType: string): number {
  const costs: Record<string, number> = {
    'cache.t3.micro': 12,
    'cache.t3.small': 24,
    'cache.t3.medium': 48,
    'cache.t4g.micro': 10,
    'cache.t4g.small': 20,
    'cache.t4g.medium': 40,
    'cache.m5.large': 93,
    'cache.m5.xlarge': 186,
    'cache.m5.2xlarge': 372,
    'cache.m6g.large': 84,
    'cache.m6g.xlarge': 168,
    'cache.r5.large': 142,
    'cache.r5.xlarge': 284,
    'cache.r6g.large': 128,
    'cache.r6g.xlarge': 256,
  };
  
  return costs[nodeType] || 50;
}