export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  status: UserStatus;
  preferences?: UserPreferences;
}

export type UserRole = 'admin' | 'user' | 'viewer';
export type UserStatus = 'active' | 'invited' | 'disabled';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    inApp?: boolean;
  };
  dashboardLayout?: any;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  planId?: string;
  planExpiryDate?: string;
  billingEmail?: string;
  createdAt: string;
  updatedAt: string;
  settings?: OrganizationSettings;
}

export interface OrganizationSettings {
  defaultCurrency?: string;
  defaultTimezone?: string;
  billingDay?: number;
  fiscalYearStart?: string;
}

export type CloudProvider = 'aws' | 'azure' | 'gcp';

export interface CloudAccount {
  id: string;
  name: string;
  description?: string;
  provider: CloudProvider;
  accountId: string;
  organizationId: string;
  status: CloudAccountStatus;
  authType: string;
  regions?: string[];
  discoveredAt?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
  tags?: Record<string, string>;
  settings?: CloudAccountSettings;
}

export type CloudAccountStatus = 'active' | 'inactive' | 'error';

export interface CloudAccountSettings {
  defaultRegion?: string;
  costCenter?: string;
  budgetAlertThreshold?: number;
  budgetAmount?: number;
  budgetPeriod?: 'monthly' | 'quarterly' | 'yearly';
  refreshInterval?: number; // In minutes
}

export type ResourceType = 
  | 'ec2'
  | 'rds'
  | 's3'
  | 'lambda'
  | 'ebs'
  | 'vpc'
  | 'elasticache'
  | 'elb'
  | 'ecs'
  | 'eks'
  | 'fargate'
  | 'cloudfront'
  | 'apigateway'
  | 'dynamodb'
  | 'other';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  cloudAccountId: string;
  region: string;
  instanceId: string;
  status: string;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
  cost?: {
    last30Days: number;
    lastMonth: number;
    forecastedThisMonth: number;
    unit: string;
  };
  createdAt: string;
  updatedAt: string;
  lastStatusChangeAt?: string;
}

export interface Tag {
  key: string;
  value: string;
  resourceCount: number;
  resourceIds: string[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
  link?: string;
  metadata?: Record<string, any>;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

export * from './organizations';
export * from './cloud-accounts';
export * from './resources';
export * from './costs';
export * from './schedules';
export * from './audit-logs';
export * from './aws';