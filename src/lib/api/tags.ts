import { apiClient } from './api-client';

// Types for request and response payloads
export interface Tag {
  key: string;
  values: string[];
  resource_count: number;
  resource_ids?: string[];
}

export interface TagSummary {
  key: string;
  values: string[];
  resource_count: number;
}

export interface TagFilter {
  key?: string;
  value?: string;
  cloud_account_id?: string;
  resource_type?: string;
}

export interface TagDetails {
  key: string;
  value: string;
  resources: {
    id: string;
    name: string;
    type: string;
    account_id: string;
    region: string;
  }[];
}

export interface UntaggedResource {
  id: string;
  name: string;
  type: string;
  account_id: string;
  account_name: string;
  region: string;
  discovered_at: string;
  last_seen_at: string;
}

export interface CreateTagRequest {
  key: string;
  value: string;
  resource_ids: string[];
}

export interface BatchTagRequest {
  tags: Record<string, string>;
  resource_ids: string[];
}

// API functions for tags
export const tagsApi = {
  /**
   * Get all tags for an organization
   */
  getAll: async (organizationId: string, filters?: TagFilter) => {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/organizations/${organizationId}/tags${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<TagSummary[]>(endpoint);
  },
  
  /**
   * Get all tags for a cloud account
   */
  getByCloudAccount: async (cloudAccountId: string, filters?: TagFilter) => {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/cloud-accounts/${cloudAccountId}/tags${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<TagSummary[]>(endpoint);
  },
  
  /**
   * Get details for a specific tag (key and value)
   */
  getTagDetails: async (organizationId: string, key: string, value: string) => {
    return apiClient.get<TagDetails>(`/organizations/${organizationId}/tags/${encodeURIComponent(key)}/${encodeURIComponent(value)}`);
  },
  
  /**
   * Create a new tag and apply it to resources
   */
  createTag: async (organizationId: string, data: CreateTagRequest) => {
    return apiClient.post<Tag>(`/organizations/${organizationId}/tags`, data);
  },
  
  /**
   * Update resources with a tag
   */
  applyTag: async (organizationId: string, key: string, value: string, resourceIds: string[]) => {
    return apiClient.post<Tag>(`/organizations/${organizationId}/tags/${encodeURIComponent(key)}/${encodeURIComponent(value)}/apply`, {
      resource_ids: resourceIds
    });
  },
  
  /**
   * Remove a tag from resources
   */
  removeTag: async (organizationId: string, key: string, value: string, resourceIds: string[]) => {
    return apiClient.post<Tag>(`/organizations/${organizationId}/tags/${encodeURIComponent(key)}/${encodeURIComponent(value)}/remove`, {
      resource_ids: resourceIds
    });
  },
  
  /**
   * Apply multiple tags to resources in a single operation
   */
  batchTagResources: async (organizationId: string, data: BatchTagRequest) => {
    return apiClient.post<void>(`/organizations/${organizationId}/tags/batch`, data);
  },
  
  /**
   * Get resources with a specific tag
   */
  getResourcesByTag: async (organizationId: string, key: string, value: string) => {
    return apiClient.get<TagDetails>(`/organizations/${organizationId}/tags/${encodeURIComponent(key)}/${encodeURIComponent(value)}/resources`);
  },
  
  /**
   * Delete a tag completely (will remove it from all resources)
   */
  deleteTag: async (organizationId: string, key: string, value: string) => {
    return apiClient.delete<void>(`/organizations/${organizationId}/tags/${encodeURIComponent(key)}/${encodeURIComponent(value)}`);
  },
  
  /**
   * Get untagged resources for an organization
   */
  getUntaggedResources: async (organizationId: string) => {
    return apiClient.get<UntaggedResource[]>(`/organizations/${organizationId}/tags/untagged-resources`);
  },

  /**
   * Get summary of tag usage (counts, popular tags, etc.)
   */
  getTagsSummary: async (organizationId: string) => {
    return apiClient.get<{
      total_tags: number;
      total_resources_tagged: number;
      untagged_resources: number;
      popular_tags: TagSummary[];
    }>(`/organizations/${organizationId}/tags/summary`);
  }
};