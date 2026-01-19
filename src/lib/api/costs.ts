import { apiClient } from './api-client';

export type CostGranularity = 'DAILY' | 'MONTHLY';

export interface CostFilter {
  accountIds?: string[];
  serviceNames?: string[];
  regions?: string[];
  resourceIds?: string[];
  tags?: Record<string, string>;
}

export interface CostData {
  date: string;
  cost: number;
  unit: string;
  is_forecast?: boolean;
  forecast_confidence_level?: number;
  forecast_lower_bound?: number;
  forecast_upper_bound?: number;
  forecast_method?: 'aws-api' | 'trend-based' | 'resource-based';
  utilization?: number;
  resourceCount?: number;
  groups?: Array<{
    key: string;
    value: string;
    cost: number;
    utilization?: number;
    resourceCount?: number;
    savingsAmount?: number;
  }>;
}

export interface ForecastData extends CostData {
  is_forecast: true;
  forecast_confidence_level: number;
  forecast_lower_bound: number;
  forecast_upper_bound: number;
  forecast_method: 'aws-api' | 'trend-based' | 'resource-based';
}

export interface CostSummary {
  totalCost: number;
  unit: string;
  previousPeriodCost?: number;
  percentChange?: number;
  forecastedCost?: number;
}

export interface CloudHealthMetrics {
  healthScore: number;
  metrics: Array<{
    name: string;
    value: number;
    unit?: string;
  }>;
  recommendations: Array<{
    type: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    potentialSavings?: number;
  }>;
}

export interface OptimizationRecommendation {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  recommendationType: string;
  description: string;
  potentialSavings: number;
  unit: string;
  details: Record<string, any>;
  status: 'pending' | 'implemented' | 'dismissed';
}

export interface OptimizationLabData {
  recommendations: OptimizationRecommendation[];
  summary: {
    totalSavings: number;
    unit: string;
    recommendationsByType: Record<string, number>;
  };
}

export interface ForecastOptions {
  includeForecast?: boolean;
  forecastDays?: number;
  forecastMethod?: 'aws-api' | 'trend-based' | 'resource-based';
  confidenceLevel?: number;
}

export interface CostTrendWithForecastResponse {
  costTrend: CostData[];
  forecast: ForecastData[];
  accounts: Array<{ id: string; name: string; cost: number; previousCost: number; utilization?: number; resourceCount?: number; savingsAmount?: number }>;
  metadata: {
    includeForecast: boolean;
    forecastMethod?: string;
    forecastDays?: number;
    confidenceLevel?: number;
    totalResourceCount?: number;
    previousResourceCount?: number;
  };
}

// API functions for costs and optimization
export const costsApi = {
  /**
   * Get cost trend data for an organization
   */
  getCostTrend: async (
    organizationId: string,
    startDate: string,
    endDate: string,
    granularity: CostGranularity = 'daily',
    filters?: CostFilter,
    groupBy?: string
  ) => {
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
      granularity
    });

    if (groupBy) {
      queryParams.append('groupBy', groupBy);
    }

    if (filters) {
      if (filters.accountIds?.length) {
        filters.accountIds.forEach(id => {
          queryParams.append('accountIds[]', id);
        });
      }
      
      if (filters.serviceNames?.length) {
        filters.serviceNames.forEach(service => {
          queryParams.append('serviceNames[]', service);
        });
      }
      
      if (filters.regions?.length) {
        filters.regions.forEach(region => {
          queryParams.append('regions[]', region);
        });
      }
      
      if (filters.resourceIds?.length) {
        filters.resourceIds.forEach(id => {
          queryParams.append('resourceIds[]', id);
        });
      }
      
      if (filters.tags) {
        Object.entries(filters.tags).forEach(([key, value]) => {
          queryParams.append(`tags[${key}]`, value);
        });
      }
    }

    return apiClient.get<CostData[]>(
      `/organizations/${organizationId}/cost-trend?${queryParams.toString()}`
    );
  },

  /**
   * Get cost trend data with forecast for an organization
   */
  getCostTrendWithForecast: async (
    organizationId: string,
    startDate: string,
    endDate: string,
    granularity: CostGranularity = 'DAILY',
    filters?: CostFilter,
    groupBy?: string,
    forecastOptions?: ForecastOptions
  ): Promise<CostTrendWithForecastResponse> => {
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
      granularity
    });

    if (groupBy) {
      queryParams.append('groupBy', groupBy);
    }

    // Add forecast options
    if (forecastOptions?.includeForecast !== undefined) {
      queryParams.append('includeForecast', forecastOptions.includeForecast.toString());
    }
    if (forecastOptions?.forecastDays) {
      queryParams.append('forecastDays', forecastOptions.forecastDays.toString());
    }
    if (forecastOptions?.forecastMethod) {
      queryParams.append('forecastMethod', forecastOptions.forecastMethod);
    }
    if (forecastOptions?.confidenceLevel) {
      queryParams.append('confidenceLevel', forecastOptions.confidenceLevel.toString());
    }

    if (filters) {
      if (filters.accountIds?.length) {
        filters.accountIds.forEach(id => {
          queryParams.append('accountIds[]', id);
        });
      }
      
      if (filters.serviceNames?.length) {
        filters.serviceNames.forEach(service => {
          queryParams.append('serviceNames[]', service);
        });
      }
      
      if (filters.regions?.length) {
        filters.regions.forEach(region => {
          queryParams.append('regions[]', region);
        });
      }
      
      if (filters.resourceIds?.length) {
        filters.resourceIds.forEach(id => {
          queryParams.append('resourceIds[]', id);
        });
      }
      
      if (filters.tags) {
        Object.entries(filters.tags).forEach(([key, value]) => {
          queryParams.append(`tags[${key}]`, value);
        });
      }
    }

    return apiClient.get<CostTrendWithForecastResponse>(
      `/organizations/${organizationId}/cost-trend-with-forecast?${queryParams.toString()}`
    );
  },
  
  /**
   * Get cloud health metrics for an organization
   */
  getCloudHealth: async (organizationId: string) => {
    return apiClient.get<CloudHealthMetrics>(`/organizations/${organizationId}/cloud-health`);
  },
  
  /**
   * Get optimization recommendations for an organization
   */
  getOptimizationLab: async (organizationId: string) => {
    return apiClient.get<OptimizationLabData>(`/organizations/${organizationId}/optimization-lab`);
  },
  
  /**
   * Get AWS cost data for a specific cloud account with enhanced metrics
   */
  getAwsCosts: async (
    cloudAccountId: string,
    startDate: string,
    endDate: string,
    granularity: 'DAILY' | 'MONTHLY' = 'DAILY',
    groupBy?: 'SERVICE' | 'REGION' | 'RESOURCE' | 'TAG',
    groupByKey?: string
  ) => {
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
      granularity
    });

    if (groupBy) {
      queryParams.append('groupBy', groupBy);
    }
    if (groupByKey) {
      queryParams.append('groupByKey', groupByKey);
    }

    try {
      return await apiClient.get(`/cloud-accounts/${cloudAccountId}/aws-costs?${queryParams.toString()}`);
    } catch (error: any) {
      // Silently fallback to empty data for 404 errors (endpoint not implemented)
      if (error?.status === 404) {
        return Promise.resolve({
          resultsByTime: [],
          total: { BlendedCost: { Amount: "0", Unit: "USD" } }
        });
      }
      // Re-throw other errors
      throw error;
    }
  },

  /**
   * Get utilization metrics from CloudWatch
   */
  getUtilizationMetrics: async (
    organizationId: string,
    startDate: string,
    endDate: string
  ) => {
    const queryParams = new URLSearchParams({
      startDate,
      endDate
    });

    return await apiClient.get(`/organizations/${organizationId}/utilization-metrics?${queryParams.toString()}`);
  },

  /**
   * Get savings data from optimization recommendations
   */
  getSavingsData: async (
    organizationId: string,
    startDate: string,
    endDate: string
  ) => {
    const queryParams = new URLSearchParams({
      startDate,
      endDate
    });

    return await apiClient.get(`/organizations/${organizationId}/savings?${queryParams.toString()}`);
  },

  /**
   * Get resource counts for the organization
   */
  getResourceCounts: async (
    organizationId: string,
    startDate: string,
    endDate: string
  ) => {
    const queryParams = new URLSearchParams({
      startDate,
      endDate
    });

    return await apiClient.get(`/organizations/${organizationId}/resource-counts?${queryParams.toString()}`);
  },

  /**
   * Trigger manual cost data sync from AWS
   */
  syncCostData: async (
    organizationId: string,
    startDate?: string,
    endDate?: string,
    granularity?: 'DAILY' | 'MONTHLY'
  ) => {
    const queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (granularity) queryParams.append('granularity', granularity);

    return await apiClient.post(`/organizations/${organizationId}/sync-cost-data?${queryParams.toString()}`);
  },

  /**
   * Get cost data sync status
   */
  getSyncStatus: async (organizationId: string) => {
    return await apiClient.get(`/organizations/${organizationId}/sync-status`);
  },

  /**
   * Trigger optimization recommendations sync from AWS
   */
  syncOptimizationData: async (organizationId: string) => {
    return await apiClient.post(`/organizations/${organizationId}/sync-optimization-data`);
  },

  /**
   * Get optimization sync status
   */
  getOptimizationSyncStatus: async (organizationId: string) => {
    return await apiClient.get(`/organizations/${organizationId}/optimization-sync-status`);
  }
};