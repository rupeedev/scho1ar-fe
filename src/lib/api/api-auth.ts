import { apiClient } from './api-client';
import { User } from './users';

export interface SignInDto {
  email: string;
  password: string;
}

export interface SignUpDto {
  email: string;
  password: string;
  display_name?: string;
}

// API functions for authentication
export const authApi = {
  /**
   * Sign in with email and password
   */
  signIn: async (credentials: SignInDto) => {
    return apiClient.post<{ token: string, user: User }>('/auth/signin', credentials);
  },

  /**
   * Sign up with email and password
   */
  signUp: async (userData: SignUpDto) => {
    return apiClient.post<{ token: string, user: User }>('/auth/signup', userData);
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    return apiClient.post<void>('/auth/signout', {});
  },

  /**
   * Verify current authentication token
   */
  verifyToken: async () => {
    return apiClient.get<{ valid: boolean }>('/auth/verify');
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string) => {
    return apiClient.post<void>('/auth/forgot-password', { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string) => {
    return apiClient.post<void>('/auth/reset-password', { token, password: newPassword });
  }
};