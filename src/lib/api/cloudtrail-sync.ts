import { apiClient } from './api-client';

export interface CloudTrailSyncRequest {
  cloudAccountId: string;
  hoursToSync?: number;
  startTime?: string;
  endTime?: string;
}

export interface CloudTrailSyncResponse {
  success: boolean;
  eventsImported: number;
  errors: string[];
  syncPeriod: {
    startTime: string;
    endTime: string;
  };
}

export interface CloudTrailSyncStatus {
  cloudAccountId: string;
  lastSync: {
    timestamp: string;
    eventsImported: number;
    success: boolean;
  } | null;
  totalCloudTrailEvents: number;
}

export interface BatchSyncResponse {
  accountsProcessed: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalEventsImported: number;
  results: Array<{
    accountId: string;
    accountName: string;
    success: boolean;
    eventsImported?: number;
    errors?: string[];
    error?: string;
  }>;
}

export const cloudTrailSyncApi = {
  /**
   * Sync CloudTrail events for a specific cloud account
   */
  syncAccount: async (request: CloudTrailSyncRequest): Promise<CloudTrailSyncResponse> => {
    return apiClient.post<CloudTrailSyncResponse>('/cloudtrail-sync/sync', request);
  },

  /**
   * Sync CloudTrail events for all cloud accounts
   */
  syncAllAccounts: async (hoursToSync: number = 24): Promise<BatchSyncResponse> => {
    return apiClient.post<BatchSyncResponse>('/cloudtrail-sync/sync-all', { hoursToSync });
  },

  /**
   * Get sync status for a cloud account
   */
  getSyncStatus: async (cloudAccountId: string): Promise<CloudTrailSyncStatus> => {
    return apiClient.get<CloudTrailSyncStatus>(`/cloudtrail-sync/status/${cloudAccountId}`);
  },
};