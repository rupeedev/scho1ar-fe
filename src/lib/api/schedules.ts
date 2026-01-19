import { apiClient } from './api-client';

export interface Schedule {
  id: string;
  name: string;
  description?: string;
  cloudAccountId: string;
  resourceIds: string[];
  cronExpression: string;
  action: 'start' | 'stop';
  timezone: string;
  enabled: boolean;
  tags?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  nextExecutionTime?: string;
  lastExecutionTime?: string;
  lastExecutionStatus?: 'success' | 'failure';
}

export interface CreateScheduleDto {
  name: string;
  description?: string;
  cloudAccountId: string;
  resourceIds: string[];
  cronExpression: string;
  action: 'start' | 'stop';
  timezone: string;
  enabled?: boolean;
  tags?: Record<string, string>;
}

export interface UpdateScheduleDto {
  name?: string;
  description?: string;
  resourceIds?: string[];
  cronExpression?: string;
  action?: 'start' | 'stop';
  timezone?: string;
  enabled?: boolean;
  tags?: Record<string, string>;
}

export interface ScheduleFilters {
  cloudAccountId?: string;
  action?: 'start' | 'stop';
  enabled?: boolean;
  resourceId?: string;
}

export interface ScheduleExecutionHistory {
  id: string;
  scheduleId: string;
  executionTime: string;
  status: 'success' | 'failure';
  details?: string;
  affectedResources: Array<{
    resourceId: string;
    resourceName: string;
    status: 'success' | 'failure';
    message?: string;
  }>;
}

export const schedulesApi = {
  getAll: async (filters?: ScheduleFilters) => {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/schedules${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<Schedule[]>(endpoint);
  },
  
  getById: async (scheduleId: string) => {
    return apiClient.get<Schedule>(`/schedules/${scheduleId}`);
  },
  
  create: async (data: CreateScheduleDto) => {
    return apiClient.post<Schedule>('/schedules', data);
  },
  
  update: async (scheduleId: string, data: UpdateScheduleDto) => {
    return apiClient.patch<Schedule>(`/schedules/${scheduleId}`, data);
  },
  
  delete: async (scheduleId: string) => {
    return apiClient.delete<void>(`/schedules/${scheduleId}`);
  },
  
  enable: async (scheduleId: string) => {
    return apiClient.post<Schedule>(`/schedules/${scheduleId}/enable`, {});
  },
  
  disable: async (scheduleId: string) => {
    return apiClient.post<Schedule>(`/schedules/${scheduleId}/disable`, {});
  },
  
  executeNow: async (scheduleId: string) => {
    return apiClient.post<{
      success: boolean;
      message: string;
      executionId?: string;
    }>(`/schedules/${scheduleId}/execute`, {});
  },
  
  getExecutionHistory: async (
    scheduleId: string,
    page: number = 1,
    limit: number = 10
  ) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    return apiClient.get<{
      data: ScheduleExecutionHistory[];
      total: number;
      page: number;
      limit: number;
    }>(`/schedules/${scheduleId}/executions?${queryParams.toString()}`);
  },
  
  getSchedulesByResource: async (resourceId: string) => {
    return apiClient.get<Schedule[]>(`/resources/${resourceId}/schedules`);
  }
};