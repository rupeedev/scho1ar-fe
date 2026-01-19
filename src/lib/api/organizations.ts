import { apiClient } from './api-client';

// Types for request and response payloads
export interface Organization {
  id: string;
  name: string;
  owner_user_id: string;
  subscription_plan: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationDto {
  name: string;
  subscription_plan?: string;
}

// API functions for organizations
export const organizationsApi = {
  /**
   * Create a new organization
   */
  create: async (data: CreateOrganizationDto) => {
    return apiClient.post<Organization>('/organizations', data);
  },

  /**
   * Get all organizations the user belongs to
   */
  getAll: async () => {
    return apiClient.get<Organization[]>('/organizations/mine');
  },

  /**
   * Get organization by ID
   */
  getById: async (id: string) => {
    return apiClient.get<Organization>(`/organizations/${id}`);
  },

  /**
   * Update organization details
   */
  update: async (id: string, data: Partial<CreateOrganizationDto>) => {
    return apiClient.put<Organization>(`/organizations/${id}`, data);
  },
};