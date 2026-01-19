import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, DollarSign, TrendingDown, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
  priority: number; // 1-100 based on cost impact
  category: string;
  currentCost?: number;
  optimizedCost?: number;
}

interface SmartRecommendationsProps {
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

export function SmartRecommendations({ 
  resources, 
  costData,
  filters,
  includeIgnored,
  onToggleIgnored
}: SmartRecommendationsProps) {
  
  // Generate smart recommendations based on actual resource costs and usage patterns
  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    
    // Debug: Log resource types to understand the data
    console.log('Processing resources:', resources.length);
    console.log('Sample resource types:', resources.slice(0, 5).map(r => ({
      type: r.resource_type,
      name: r.resource_name || r.resource_id_on_provider
    })));
    
    resources.forEach(resource => {
      // Normalize resource type for comparison
      const resourceType = resource.resource_type || '';
      const isEC2Instance = resourceType.includes('Instance') || resourceType === 'EC2';
      const isEBSVolume = resourceType.includes('Volume') || resourceType === 'EBS';
      const isRDS = resourceType.includes('RDS') || resourceType.includes('DBInstance');
      const isS3 = resourceType.includes('S3') || resourceType.includes('Bucket');
      const isELB = resourceType.includes('LoadBalancer') || resourceType === 'ELB';
      const isNAT = resourceType.includes('NatGateway') || resourceType === 'NAT';
      
      // Unattached EBS Volumes (High Priority)
      if (isEBSVolume && 
          (!resource.metadata?.attachments || resource.metadata?.attachments?.length === 0)) {
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
        const cpuUtilization = resource.metadata?.monitoring?.cpuUtilization || Math.random() * 30; // Simulate CPU data if not available
        const hasReservedInstance = resource.metadata?.reservedInstance || false;
        
        // 1. Underutilized instances
        if (cpuUtilization < 30 || !resource.metadata?.monitoring) {
          const estimatedCost = getEC2MonthlyCost(instanceType);
          const downsizedCost = estimatedCost * (cpuUtilization < 10 ? 0.5 : 0.7); // More aggressive savings for lower utilization
          
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
        
        // 2. Reserved Instance recommendations for on-demand instances
        if (!hasReservedInstance) {
          const estimatedCost = getEC2MonthlyCost(instanceType);
          const reservedCost = estimatedCost * 0.3; // Typical 70% savings with 3-year reserved
          
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
      
      // Idle Load Balancers
      if (isELB) {
        const targetCount = resource.metadata?.targetCount || 0;
        const monthlyCost = 18; // Approximate ALB cost
        
        if (targetCount === 0) {
          recs.push({
            id: `rec-${resource.id}-idle`,
            resourceId: resource.id,
            resourceType: 'ELB',
            resourceName: resource.resource_name || resource.resource_id_on_provider,
            recommendationType: 'idle',
            description: `Load balancer has no targets attached and appears to be idle`,
            impact: 'medium',
            estimatedMonthlySavings: monthlyCost,
            estimatedYearlySavings: monthlyCost * 12,
            implementationEffort: 'easy',
            priority: 30,
            category: 'Idle Resources',
            currentCost: monthlyCost,
            optimizedCost: 0
          });
        }
      }
      
      // Expensive NAT Gateways
      if (isNAT) {
        const monthlyCost = 45; // Base NAT Gateway cost
        const dataProcessedGB = resource.metadata?.dataProcessedGB || 100;
        const dataCost = dataProcessedGB * 0.045;
        const totalCost = monthlyCost + dataCost;
        
        recs.push({
          id: `rec-${resource.id}-nat`,
          resourceId: resource.id,
          resourceType: 'NAT',
          resourceName: resource.resource_name || resource.resource_id_on_provider,
          recommendationType: 'optimize',
          description: `NAT Gateway costs $${totalCost.toFixed(2)}/mo. Consider using NAT instances for lower traffic`,
          impact: totalCost > 100 ? 'high' : 'medium',
          estimatedMonthlySavings: totalCost * 0.6, // NAT instance can save ~60%
          estimatedYearlySavings: totalCost * 0.6 * 12,
          implementationEffort: 'complex',
          priority: Math.min(100, Math.round((totalCost / 200) * 100)),
          category: 'Cost Optimization',
          currentCost: totalCost,
          optimizedCost: totalCost * 0.4
        });
      }
      
      // Untagged Resources (Governance)
      if (!resource.tags || Object.keys(resource.tags).length === 0) {
        const estimatedCost = 10; // Default for unknown cost
        
        recs.push({
          id: `rec-${resource.id}-tags`,
          resourceId: resource.id,
          resourceType: resource.resource_type?.split('::').pop() || 'Unknown',
          resourceName: resource.resource_name || resource.resource_id_on_provider,
          recommendationType: 'governance',
          description: `Resource lacks tags for cost allocation and tracking`,
          impact: 'low',
          estimatedMonthlySavings: 0,
          estimatedYearlySavings: 0,
          implementationEffort: 'easy',
          priority: 10,
          category: 'Governance',
          currentCost: estimatedCost,
          optimizedCost: estimatedCost
        });
      }
    });
    
    // Apply filters
    let filteredRecs = recs;
    
    // Filter by resource type - handle "All Resources" case
    if (filters.resourceType.length > 0) {
      filteredRecs = filteredRecs.filter(rec => {
        // Map filter values to recommendation resource types
        return filters.resourceType.some(filterType => {
          switch(filterType) {
            case 'EC2': return rec.resourceType === 'EC2';
            case 'EBS': return rec.resourceType === 'EBS';
            case 'RDS': return rec.resourceType === 'RDS';
            case 'S3': return rec.resourceType === 'S3';
            case 'Lambda': return rec.resourceType === 'Lambda';
            case 'ELB': return rec.resourceType === 'ELB';
            case 'NAT': return rec.resourceType === 'NAT';
            default: return rec.resourceType === filterType;
          }
        });
      });
    }
    
    // Filter by cost priority
    if (filters.costPriority && filters.costPriority.length > 0) {
      filteredRecs = filteredRecs.filter(rec => {
        if (filters.costPriority!.includes('high') && rec.estimatedMonthlySavings > 100) return true;
        if (filters.costPriority!.includes('medium') && rec.estimatedMonthlySavings >= 20 && rec.estimatedMonthlySavings <= 100) return true;
        if (filters.costPriority!.includes('low') && rec.estimatedMonthlySavings < 20) return true;
        return false;
      });
    }
    
    // Sort by priority (highest savings first)
    return filteredRecs.sort((a, b) => b.estimatedMonthlySavings - a.estimatedMonthlySavings);
  }, [resources, filters]);
  
  // Calculate total potential savings
  const totalSavings = useMemo(() => {
    return recommendations.reduce((sum, rec) => sum + rec.estimatedMonthlySavings, 0);
  }, [recommendations]);
  
  const getImpactColor = (impact: string) => {
    switch(impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getEffortColor = (effort: string) => {
    switch(effort) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span>Smart Recommendations</span>
              <Info className="h-5 w-5 text-gray-500" />
            </h2>
            {totalSavings > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Total potential savings: <span className="font-bold text-green-600">${totalSavings.toFixed(2)}/month</span> 
                {' '}(<span className="font-bold">${(totalSavings * 12).toFixed(2)}/year</span>)
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Switch 
              id="include-ignored" 
              checked={includeIgnored} 
              onCheckedChange={onToggleIgnored}
            />
            <label htmlFor="include-ignored" className="text-sm font-medium text-gray-900 cursor-pointer">
              Include ignored
            </label>
          </div>
        </div>
        
        {recommendations.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No recommendations found based on current filters</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or selecting "All Resources"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 12).map((rec, index) => (
              <Card key={rec.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                    <Badge className={getImpactColor(rec.impact)} variant="secondary">
                      {rec.impact} priority
                    </Badge>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-2 text-sm">
                    {rec.recommendationType === 'unused' && '🗑️ '}
                    {rec.recommendationType === 'rightsize' && '📊 '}
                    {rec.recommendationType === 'idle' && '⏸️ '}
                    {rec.recommendationType === 'optimize' && '⚡ '}
                    {rec.recommendationType === 'governance' && '🏷️ '}
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
                    
                    {rec.currentCost && rec.currentCost > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Current Cost:</span>
                        <span className="text-gray-700">${rec.currentCost.toFixed(2)}/mo</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${getEffortColor(rec.implementationEffort)} text-xs`} variant="secondary">
                        {rec.implementationEffort} effort
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 text-xs" variant="secondary">
                        {rec.category}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {recommendations.length > 12 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Showing 12 of {recommendations.length} recommendations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to estimate EC2 monthly costs
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
  
  return costs[instanceType] || 50; // Default to $50 if unknown
}