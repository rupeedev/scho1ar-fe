import { apiClient } from './api-client';

// Types for request and response payloads
export interface User {
  id: string;
  email: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
  last_login_at?: string;
  role?: UserRole;
  created_at: string;
  updated_at: string;
  last_active_at?: string;
  organization_id?: string;
  organization_name?: string;
}

export type UserRole = 'admin' | 'member' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'invited' | 'pending';

export interface UserProfile {
  id: string;
  user_id: string;
  organization_id: string;
  billing_address?: Address;
  shipping_address?: Address;
  payment_method?: PaymentMethod;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface PaymentMethod {
  type: string;
  last4: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default?: boolean;
}

export interface UpdateUserDto {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  is_active?: boolean;
  role?: UserRole;
}

export interface CreateUserDto {
  email: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  send_invitation?: boolean;
  is_active?: boolean;
}

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

export interface UpdatePasswordDto {
  current_password: string;
  new_password: string;
}

export interface UpdateProfileDto {
  billing_address?: Address;
  shipping_address?: Address;
  preferences?: Record<string, any>;
}

// API functions for users
export const usersApi = {
  /**
   * Get the current user's profile
   */
  getCurrentUser: async () => {
    return apiClient.get<User>('/users/me');
  },

  /**
   * Update the current user's profile
   */
  updateCurrentUser: async (data: UpdateUserDto) => {
    return apiClient.patch<User>('/users/me', data);
  },

  /**
   * Change the current user's password
   */
  changePassword: async (data: UpdatePasswordDto) => {
    return apiClient.post<void>('/users/me/password', data);
  },

  /**
   * Get user profile including addresses and payment methods
   */
  getUserProfile: async () => {
    return apiClient.get<UserProfile>('/users/me/profile');
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (data: UpdateProfileDto) => {
    return apiClient.patch<UserProfile>('/users/me/profile', data);
  },

  /**
   * Get all users in the organization with optional filters and pagination
   */
  getOrganizationUsers: async (organizationId: string, filters?: UserFilters, page: number = 1, limit: number = 10) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    return apiClient.get<{
      data: User[];
      total: number;
      page: number;
      limit: number;
    }>(`/organizations/${organizationId}/users?${queryParams.toString()}`);
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: string) => {
    return apiClient.get<User>(`/users/${userId}`);
  },
  
  /**
   * Create a new user in the organization
   */
  createUser: async (organizationId: string, data: CreateUserDto) => {
    return apiClient.post<User>(`/organizations/${organizationId}/users`, data);
  },
  
  /**
   * Update a user
   */
  updateUser: async (userId: string, data: UpdateUserDto) => {
    return apiClient.patch<User>(`/users/${userId}`, data);
  },
  
  /**
   * Delete a user
   */
  deleteUser: async (userId: string) => {
    return apiClient.delete<void>(`/users/${userId}`);
  },
  
  /**
   * Resend invitation to a pending user
   */
  resendInvitation: async (userId: string) => {
    return apiClient.post<void>(`/users/${userId}/resend-invitation`, {});
  },
  
  /**
   * Get user teams
   */
  getUserTeams: async (userId: string) => {
    return apiClient.get<any[]>(`/users/${userId}/teams`);
  }
};