import { apiClient } from './api-client';

// Types for request and response payloads
export type ResourceType = 
  | 'ec2_instance'
  | 's3_bucket'
  | 'rds_instance'
  | 'lambda_function'
  | 'ebs_volume'
  | 'elb'
  | 'elasticache'
  | 'other';

export interface Resource {
  id: string;
  cloud_account_id: string;
  resource_id_on_provider: string;
  resource_name: string;
  resource_type: ResourceType;
  region: string;
  status: string;
  tags: Record<string, string>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ResourceFilters {
  type?: ResourceType;
  region?: string;
  status?: string;
  tags?: Record<string, string>;
  created_after?: string;  // ISO date string for date range filtering
  created_before?: string; // ISO date string for date range filtering
}

// API functions for resources
export const resourcesApi = {
  getAll: async (cloudAccountId: string, filters?: ResourceFilters) => {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'tags' && typeof value === 'object') {
            Object.entries(value).forEach(([tagKey, tagValue]) => {
              queryParams.append(`tags[${tagKey}]`, tagValue);
            });
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/cloud-accounts/${cloudAccountId}/resources${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<Resource[]>(endpoint);
  },

  getCount: async (cloudAccountId: string, filters?: ResourceFilters) => {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'tags' && typeof value === 'object') {
            Object.entries(value).forEach(([tagKey, tagValue]) => {
              queryParams.append(`tags[${tagKey}]`, tagValue);
            });
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/cloud-accounts/${cloudAccountId}/resources/count${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<{ count: number }>(endpoint);
  },

  getStats: async (cloudAccountId: string, filters?: ResourceFilters) => {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'tags' && typeof value === 'object') {
            Object.entries(value).forEach(([tagKey, tagValue]) => {
              queryParams.append(`tags[${tagKey}]`, tagValue);
            });
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/cloud-accounts/${cloudAccountId}/resources/stats${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<{
      total: number;
      byType: Record<string, number>;
      byStatus: Record<string, number>;
      byRegion: Record<string, number>;
    }>(endpoint);
  },
  
  /**
   * Get resource by ID
   */
  getById: async (resourceId: string) => {
    return apiClient.get<Resource>(`/resources/${resourceId}`);
  },
  
  /**
   * Assign a resource to a team
   */
  assignToTeam: async (resourceId: string, teamId: string) => {
    return apiClient.post<Resource>(`/resources/${resourceId}/team/${teamId}`, {});
  },
  
  /**
   * Remove a resource from a team
   */
  removeFromTeam: async (resourceId: string) => {
    return apiClient.delete<void>(`/resources/${resourceId}/team`);
  },
  
  /**
   * Start a resource (if supported by the provider)
   */
  start: async (resourceId: string) => {
    return apiClient.post<Resource>(`/resources/${resourceId}/start`, {});
  },
  
  /**
   * Stop a resource (if supported by the provider)
   */
  stop: async (resourceId: string) => {
    return apiClient.post<Resource>(`/resources/${resourceId}/stop`, {});
  },
  
  /**
   * Get resource metrics
   */
  getMetrics: async (resourceId: string, metricName: string, startTime: Date, endTime: Date, period: number = 300) => {
    const queryParams = new URLSearchParams({
      metricName,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      period: period.toString()
    });
    
    return apiClient.get<any>(`/resources/${resourceId}/metrics?${queryParams.toString()}`);
  },

  /**
   * Get resource cost history
   */
  getCostHistory: async (resourceId: string, startDate: string, endDate: string) => {
    const queryParams = new URLSearchParams({
      startDate,
      endDate
    });
    
    return apiClient.get<any>(`/resources/${resourceId}/costs?${queryParams.toString()}`);
  },

  /**
   * Get resource usage recommendations
   */
  getRecommendations: async (resourceId: string) => {
    return apiClient.get<any>(`/resources/${resourceId}/recommendations`);
  },

  /**
   * Update resource tags
   */
  updateTags: async (resourceId: string, tags: Record<string, string>) => {
    return apiClient.patch<Resource>(`/resources/${resourceId}/tags`, { tags });
  }
};