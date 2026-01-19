import { apiClient } from './api-client';

// Types for settings
export interface UserNotificationSettings {
  email_notifications_enabled: boolean;
  notification_hours_start?: number; // 0-23
  notification_hours_end?: number; // 0-23
  timezone: string;
  notification_channels: NotificationChannel[];
}

export interface NotificationChannel {
  channel_type: 'email' | 'in_app' | 'sms';
  enabled: boolean;
  notification_types?: string[]; // e.g., ['cost_alert', 'resource_health', 'scheduled_events']
}

export interface OrganizationSettings {
  default_currency: string;
  default_timezone: string;
  billing_day?: number;
  fiscal_year_start?: string;
  company_name: string;
  company_logo_url?: string;
  support_email?: string;
  default_notification_settings?: UserNotificationSettings;
}

export interface BillingSettings {
  plan_id: string;
  plan_name: string;
  plan_price: number;
  plan_interval: 'monthly' | 'yearly';
  trial_end_date?: string;
  auto_renew: boolean;
  billing_email: string;
  payment_methods: PaymentMethod[];
  resource_quota: number;
  user_quota: number;
  current_resource_count: number;
  current_user_count: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  brand?: string;
  last4: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  billing_address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  pdf_url?: string;
}

export interface SSOSettings {
  enabled: boolean;
  provider?: 'google' | 'okta' | 'azure_ad' | 'custom';
  idp_entity_id?: string;
  sso_url?: string;
  certificate?: string;
  domains?: string[];
}

export interface UpdateNotificationSettingsDto {
  email_notifications_enabled?: boolean;
  notification_hours_start?: number;
  notification_hours_end?: number;
  timezone?: string;
  notification_channels?: Partial<NotificationChannel>[];
}

export interface UpdateOrganizationSettingsDto {
  default_currency?: string;
  default_timezone?: string;
  billing_day?: number;
  fiscal_year_start?: string;
  company_name?: string;
  company_logo_url?: string;
  support_email?: string;
  default_notification_settings?: Partial<UserNotificationSettings>;
}

export interface UpdateSSOSettingsDto {
  enabled?: boolean;
  provider?: 'google' | 'okta' | 'azure_ad' | 'custom';
  idp_entity_id?: string;
  sso_url?: string;
  certificate?: string;
  domains?: string[];
}

// API functions for settings
export const settingsApi = {
  /**
   * Get current user's notification settings
   */
  getUserNotificationSettings: async () => {
    return apiClient.get<UserNotificationSettings>('/settings/notifications');
  },

  /**
   * Update current user's notification settings
   */
  updateUserNotificationSettings: async (settings: UpdateNotificationSettingsDto) => {
    return apiClient.patch<UserNotificationSettings>('/settings/notifications', settings);
  },

  /**
   * Get organization settings
   */
  getOrganizationSettings: async (organizationId: string) => {
    return apiClient.get<OrganizationSettings>(`/organizations/${organizationId}/settings`);
  },

  /**
   * Update organization settings
   */
  updateOrganizationSettings: async (organizationId: string, settings: UpdateOrganizationSettingsDto) => {
    return apiClient.patch<OrganizationSettings>(`/organizations/${organizationId}/settings`, settings);
  },

  /**
   * Get billing settings
   */
  getBillingSettings: async (organizationId: string) => {
    return apiClient.get<BillingSettings>(`/organizations/${organizationId}/billing`);
  },

  /**
   * Get organization invoices
   */
  getInvoices: async (organizationId: string, limit: number = 10, page: number = 1) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString()
    });
    
    return apiClient.get<Invoice[]>(`/organizations/${organizationId}/invoices?${params.toString()}`);
  },

  /**
   * Add payment method
   */
  addPaymentMethod: async (organizationId: string, paymentToken: string) => {
    return apiClient.post<PaymentMethod>(`/organizations/${organizationId}/payment-methods`, { token: paymentToken });
  },

  /**
   * Delete payment method
   */
  deletePaymentMethod: async (organizationId: string, paymentMethodId: string) => {
    return apiClient.delete<void>(`/organizations/${organizationId}/payment-methods/${paymentMethodId}`);
  },

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod: async (organizationId: string, paymentMethodId: string) => {
    return apiClient.post<void>(`/organizations/${organizationId}/payment-methods/${paymentMethodId}/default`);
  },

  /**
   * Get SSO settings
   */
  getSSOSettings: async (organizationId: string) => {
    return apiClient.get<SSOSettings>(`/organizations/${organizationId}/sso`);
  },

  /**
   * Update SSO settings
   */
  updateSSOSettings: async (organizationId: string, settings: UpdateSSOSettingsDto) => {
    return apiClient.patch<SSOSettings>(`/organizations/${organizationId}/sso`, settings);
  },

  /**
   * Delete organization account
   */
  deleteOrganization: async (organizationId: string) => {
    return apiClient.delete<void>(`/organizations/${organizationId}`);
  }
};