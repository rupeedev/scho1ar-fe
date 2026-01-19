import { apiClient } from './api-client';

export type AuditLogAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'start'
  | 'stop'
  | 'sync'
  | 'login'
  | 'logout'
  | 'settings_change'
  | 'permission_change'
  | 'schedule_execution'
  | 'schedule_failed'
  | 'resource_discovered'
  | 'cost_sync'
  | 'budget_exceeded'
  | 'read'  // CloudTrail actions
  | 'assume_role'
  | 'execute'
  | 'LookupEvents'
  | string;  // Allow any string for flexibility with CloudTrail

export type AuditLogResource = 
  | 'user'
  | 'organization'
  | 'cloud_account'
  | 'resource'
  | 'schedule'
  | 'team'
  | 'cost'
  | 'settings'
  | 'system'
  | 'EC2'  // AWS Services
  | 'SSM'
  | 'XRAY'
  | 'TAGGING'
  | 'STS'
  | 'MONITORING'
  | 'LOGS'
  | 'CloudTrail'
  | 'CONFIG'
  | 'ELB'
  | string;  // Allow any string for flexibility with CloudTrail

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  action: AuditLogAction;
  resource: AuditLogResource;
  resourceId?: string;
  resourceName?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  organizationId?: string;
  success: boolean;
  errorMessage?: string;
}

export interface AuditLogFilters {
  organizationId?: string;
  userId?: string;
  action?: AuditLogAction;
  resource?: AuditLogResource;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  success?: boolean;
  importanceLevel?: 'high' | 'medium' | 'low' | 'important';
}


export const auditLogsApi = {
  getAll: async (
    filters?: AuditLogFilters,
    page: number = 1,
    limit: number = 50,
    sortBy: string = 'timestamp',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) => {
    // Get organization ID from localStorage or context
    const organizationId = filters?.organizationId || localStorage.getItem('organizationId') || 'default';
    
    // Build query params for backend expectations
    const queryParams = new URLSearchParams();
    
    // Map frontend filters to backend DTOs
    if (filters?.userId) queryParams.append('user_id', filters.userId);
    if (filters?.action) queryParams.append('action_type', filters.action);
    if (filters?.resource) queryParams.append('target_resource_type', filters.resource);
    if (filters?.resourceId) queryParams.append('target_resource_id', filters.resourceId);
    if (filters?.startDate) queryParams.append('start_date', filters.startDate);
    if (filters?.endDate) queryParams.append('end_date', filters.endDate);
    if (filters?.importanceLevel) queryParams.append('importance_level', filters.importanceLevel);
    
    // Add pagination params - backend now supports these
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    try {
      const response = await apiClient.get<any>(
        `/organizations/${organizationId}/audit-logs?${queryParams.toString()}`
      );
      
      // Handle both paginated and non-paginated responses for backward compatibility
      const logs = response.data || response;
      const metadata = response.metadata;
      
      // Transform backend response to match frontend interface
      const transformedLogs: AuditLog[] = (Array.isArray(logs) ? logs : []).map(log => ({
        id: log.id.toString(),
        timestamp: log.timestamp,
        userId: log.user_id || 'system',
        userEmail: log.user?.email,
        userName: log.user?.name || log.user?.email?.split('@')[0] || 'System',
        action: log.action_type as AuditLogAction,
        resource: log.target_resource_type as AuditLogResource || 'system',
        resourceId: log.target_resource_id,
        resourceName: log.details?.resource_name || log.target_resource_id,
        ipAddress: log.ip_address,
        userAgent: log.details?.user_agent,
        details: log.details,
        organizationId: log.organization_id,
        success: log.details?.success !== false, // Assume success unless explicitly false
        errorMessage: log.details?.error_message
      }));
      
      return {
        data: transformedLogs,
        total: metadata?.total || transformedLogs.length,
        page: metadata?.page || page,
        limit: metadata?.limit || limit,
        totalPages: metadata?.totalPages,
        hasNextPage: metadata?.hasNextPage,
        hasPreviousPage: metadata?.hasPreviousPage
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },
  
  getById: async (logId: string, organizationId?: string) => {
    const orgId = organizationId || localStorage.getItem('organizationId') || 'default';
    
    try {
      const response = await apiClient.get<any>(
        `/organizations/${orgId}/audit-logs/${logId}`
      );
      
      // Transform backend response
      const transformedLog: AuditLog = {
        id: response.id.toString(),
        timestamp: response.timestamp,
        userId: response.user_id || 'system',
        userEmail: response.user?.email,
        userName: response.user?.name || response.user?.email?.split('@')[0] || 'System',
        action: response.action_type as AuditLogAction,
        resource: response.target_resource_type as AuditLogResource || 'system',
        resourceId: response.target_resource_id,
        resourceName: response.details?.resource_name || response.target_resource_id,
        ipAddress: response.ip_address,
        userAgent: response.details?.user_agent,
        details: response.details,
        organizationId: response.organization_id,
        success: response.details?.success !== false,
        errorMessage: response.details?.error_message
      };
      
      return transformedLog;
    } catch (error) {
      console.error('Error fetching audit log:', error);
      throw error;
    }
  },
  
  getUserActivity: async (
    userId: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 20,
    organizationId?: string
  ) => {
    const orgId = organizationId || localStorage.getItem('organizationId') || 'default';
    
    const queryParams = new URLSearchParams({
      user_id: userId
    });
    
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    // Use the main getAll endpoint with user filter
    return auditLogsApi.getAll(
      {
        organizationId: orgId,
        userId,
        startDate,
        endDate
      },
      page,
      limit
    );
  },
  
  getResourceActivity: async (
    resourceType: AuditLogResource,
    resourceId: string,
    page: number = 1,
    limit: number = 20,
    organizationId?: string
  ) => {
    const orgId = organizationId || localStorage.getItem('organizationId') || 'default';
    
    // Use the main getAll endpoint with resource filters
    return auditLogsApi.getAll(
      {
        organizationId: orgId,
        resource: resourceType,
        resourceId
      },
      page,
      limit
    );
  },
  
  getEventSummary: async (
    organizationId: string,
    startDate: string,
    endDate: string
  ) => {
    // Since backend doesn't have a summary endpoint yet, calculate from fetched data
    try {
      const response = await auditLogsApi.getAll(
        {
          organizationId,
          startDate,
          endDate
        },
        1,
        1000 // Fetch more logs for summary
      );
      
      const logs = response.data;
      const totalEvents = logs.length;
      const successfulEvents = logs.filter(log => log.success).length;
      const failedEvents = totalEvents - successfulEvents;
      
      // Calculate events by action
      const eventsByAction = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<AuditLogAction, number>);
      
      // Calculate events by resource
      const eventsByResource = logs.reduce((acc, log) => {
        acc[log.resource] = (acc[log.resource] || 0) + 1;
        return acc;
      }, {} as Record<AuditLogResource, number>);
      
      // Calculate top users
      const userCounts = logs.reduce((acc, log) => {
        if (log.userId !== 'system') {
          acc[log.userId] = {
            userId: log.userId,
            userName: log.userName || log.userEmail || log.userId,
            eventCount: (acc[log.userId]?.eventCount || 0) + 1
          };
        }
        return acc;
      }, {} as Record<string, { userId: string; userName: string; eventCount: number }>);
      
      const topUsers = Object.values(userCounts)
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 5);
      
      return {
        totalEvents,
        successfulEvents,
        failedEvents,
        eventsByAction,
        eventsByResource,
        topUsers
      };
    } catch (error) {
      console.error('Error calculating event summary:', error);
      // Return empty summary on error
      return {
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        eventsByAction: {} as Record<AuditLogAction, number>,
        eventsByResource: {} as Record<AuditLogResource, number>,
        topUsers: []
      };
    }
  }
};