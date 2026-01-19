import { apiClient } from './api-client';

export type AwsAuthType = 'api_key' | 'role_arn' | 'instance_profile' | 'env_vars';

export interface AwsApiKeyCredentials {
  accessKeyId: string;
  secretAccessKey: string;
}

export interface AwsRoleArnCredentials {
  roleArn: string;
  externalId?: string;
}

export interface AwsCredentialsValidationResult {
  valid: boolean;
  accountId?: string;
  error?: string;
}

export interface AwsRegion {
  code: string;
  name: string;
}

export interface AwsService {
  code: string;
  name: string;
}

export interface AwsResourceRecommendation {
  resourceId: string;
  resourceName?: string;
  resourceType: string;
  finding: 'OVER_PROVISIONED' | 'UNDER_PROVISIONED' | 'OPTIMIZED';
  currentConfiguration: Record<string, any>;
  recommendedConfiguration: Record<string, any>;
  projectedUtilization: Record<string, any>;
  estimatedMonthlySavings?: {
    amount: number;
    currency: string;
  };
  reason: string;
}

// API functions for AWS operations
export const awsApi = {
  validateCredentials: async (
    authType: AwsAuthType,
    credentials?: AwsApiKeyCredentials | AwsRoleArnCredentials,
    region: string = 'us-east-1'
  ) => {
    return apiClient.post<AwsCredentialsValidationResult>('/v1/aws/validate-credentials', {
      auth_type: authType,
      credentials,
      region
    });
  },
  
  listRegions: async () => {
    return apiClient.get<AwsRegion[]>('/aws/regions');
  },
  
  listServices: async () => {
    return apiClient.get<AwsService[]>('/aws/services');
  },
  
  discoverResources: async (cloudAccountId: string) => {
    return apiClient.post<{
      success: boolean;
      message: string;
      resourceCount?: number;
    }>(`/v1/aws/cloud-accounts/${cloudAccountId}/discover-resources`, {});
  },
  
  getCostAndUsage: async (
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
      if (groupBy === 'TAG' && groupByKey) {
        queryParams.append('groupByKey', groupByKey);
      }
    }
    
    return apiClient.get<any>(
      `/v1/aws/cloud-accounts/${cloudAccountId}/costs?${queryParams.toString()}`
    );
  },
  
  getOptimizationRecommendations: async (
    cloudAccountId: string,
    resourceType?: 'EC2' | 'EBS' | 'LAMBDA' | 'ALL'
  ) => {
    const queryParams = new URLSearchParams();
    if (resourceType) {
      queryParams.append('resourceType', resourceType);
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/v1/aws/cloud-accounts/${cloudAccountId}/recommendations${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<{
      recommendations: AwsResourceRecommendation[];
      totalPotentialSavings: {
        amount: number;
        currency: string;
      };
    }>(endpoint);
  },
  
  /**
   * Control a resource (start/stop)
   */
  controlResource: async (
    resourceId: string,
    action: 'start' | 'stop'
  ) => {
    return apiClient.post<{
      success: boolean;
      message: string;
    }>(`/v1/aws/resources/${resourceId}/control`, { action });
  },
  
  getInstanceTypes: async (region: string = 'us-east-1') => {
    return apiClient.get<Array<{
      instanceType: string;
      family: string;
      vCPU: number;
      memoryGiB: number;
      storageType: string;
      networkPerformance: string;
      pricePerHour?: number;
    }>>(`/aws/instance-types?region=${region}`);
  },
  
  getRightsizingRecommendations: async (
    cloudAccountId: string,
    resourceIds?: string[]
  ) => {
    const queryParams = new URLSearchParams();
    
    if (resourceIds?.length) {
      resourceIds.forEach(id => {
        queryParams.append('resourceIds[]', id);
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/cloud-accounts/${cloudAccountId}/aws/rightsizing${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<{
      recommendations: Array<{
        resourceId: string;
        resourceName?: string;
        currentConfiguration: {
          instanceType: string;
          vCPU: number;
          memory: number;
        };
        recommendedConfiguration: {
          instanceType: string;
          vCPU: number;
          memory: number;
        };
        estimatedMonthlySavings: {
          amount: number;
          currency: string;
        };
        reason: string;
      }>;
      totalPotentialSavings: {
        amount: number;
        currency: string;
      };
    }>(endpoint);
  }
};