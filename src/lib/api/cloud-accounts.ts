import { apiClient } from './api-client';

// Types for request and response payloads
export interface CloudAccount {
  id: string;
  organization_id: string;
  name: string;
  provider: string;
  account_id_on_provider: string;
  credentials_vault_id?: string;
  access_type: string;
  permission_type: string;
  status: string;
  region?: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CloudAccountCredentials {
  access_key_id?: string;
  secret_access_key?: string;
  role_arn?: string;
  external_id?: string;
}

export interface CreateCloudAccountDto {
  name: string;
  provider: string;
  account_id_on_provider: string;
  access_type: 'access_key' | 'role_arn' | 'service_principal';
  permission_type: 'readonly' | 'readwrite';
  region?: string;
  credentials?: CloudAccountCredentials;
}

export interface UpdateCloudAccountDto {
  name?: string;
  permission_type?: 'readonly' | 'readwrite';
  status?: string;
  region?: string;
  credentials?: CloudAccountCredentials;
}

export interface NetworkTopologyNode {
  id: string;
  type: 'vpc' | 'subnet' | 'resource';
  parentId?: string;
  data: {
    label: string;
    cost?: number;
    resourceCount?: number;
    resourceType?: string;
    status?: string;
    region?: string;
    tags?: any;
  };
  position: { x: number; y: number };
  style?: any;
}

export interface NetworkTopologyEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
}

export interface NetworkTopologyData {
  nodes: NetworkTopologyNode[];
  edges: NetworkTopologyEdge[];
  account: CloudAccount;
  stats: {
    totalResources: number;
    totalVpcs: number;
    totalCost: number;
  };
}

export interface ResourceRelationship {
  source: string;
  target: string;
  type: string;
  label: string;
}

export interface ResourceRelationshipsData {
  relationships: ResourceRelationship[];
  resourceCount: number;
  relationshipCount: number;
}

// API functions for cloud accounts
export const cloudAccountsApi = {
  /**
   * Create a new cloud account within an organization
   */
  create: async (organizationId: string, data: CreateCloudAccountDto) => {
    return apiClient.post<CloudAccount>(
      `/organizations/${organizationId}/cloud-accounts`, 
      data
    );
  },

  /**
   * Get all cloud accounts for an organization
   */
  getAll: async (organizationId: string) => {
    return apiClient.get<CloudAccount[]>(
      `/organizations/${organizationId}/cloud-accounts`
    );
  },

  /**
   * Get cloud account by ID
   */
  getById: async (id: string) => {
    return apiClient.get<CloudAccount>(`/cloud-accounts/${id}`);
  },

  /**
   * Update cloud account details
   */
  update: async (id: string, data: UpdateCloudAccountDto) => {
    return apiClient.put<CloudAccount>(`/cloud-accounts/${id}`, data);
  },

  /**
   * Delete a cloud account
   */
  delete: async (id: string) => {
    return apiClient.delete<void>(`/cloud-accounts/${id}`);
  },

  /**
   * Sync a cloud account to discover resources
   */
  sync: async (id: string) => {
    return apiClient.post<{ 
      status: string; 
      message: string;
      discoveryTriggered?: boolean;
      discoveryResult?: {
        success: boolean;
        message: string;
        resourceCount?: number;
      };
      discoveryError?: string;
    }>(`/cloud-accounts/${id}/sync`);
  },

  /**
   * Get network topology data for a cloud account
   */
  getNetworkTopology: async (id: string) => {
    return apiClient.get<NetworkTopologyData>(`/cloud-accounts/${id}/network-topology`);
  },

  /**
   * Get resource relationships for a cloud account
   */
  getResourceRelationships: async (id: string) => {
    return apiClient.get<ResourceRelationshipsData>(`/cloud-accounts/${id}/resource-relationships`);
  },
};