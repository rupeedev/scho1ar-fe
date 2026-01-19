import { apiClient } from './api-client';

// Reservation type definitions
export interface BaseReservation {
  id: string;
  cloud_account_id: string;
  cloud_account_name?: string;
  region: string;
  instance_type?: string;
  resource_type?: string;
  potential_monthly_savings: number;
  potential_savings_percentage: number;
  available_instances: number;
  reserved_instances: number;
  updated_at: string;
  service_type: 'ec2' | 'rds' | 'elasticache' | 'opensearch' | 'redshift' | 'dynamodb' | 'lambda' | 'sagemaker';
  savings_type?: 'Reserved Instance' | 'Reserved Capacity' | 'Savings Plans';
}

export interface EC2Reservation extends BaseReservation {
  service_type: 'ec2';
  tenancy: string;
  platform: string;
  recommendations: EC2ReservationRecommendation[];
}

export interface RDSReservation extends BaseReservation {
  service_type: 'rds';
  multi_az: boolean;
  database_engine: string;
  recommendations: RDSReservationRecommendation[];
}

export type Reservation = EC2Reservation | RDSReservation;

export interface BaseReservationRecommendation {
  id: string;
  reservation_id: string;
  instance_type: string;
  quantity: number;
  payment_option: 'no_upfront' | 'partial_upfront' | 'all_upfront';
  term: number; // in months
  upfront_cost: number;
  monthly_cost: number;
  savings_amount: number;
  savings_percentage: number;
  created_at: string;
}

export interface EC2ReservationRecommendation extends BaseReservationRecommendation {
  platform?: string;
  tenancy?: string;
}

export interface RDSReservationRecommendation extends BaseReservationRecommendation {
  database_engine?: string;
  multi_az?: boolean;
}

export type ReservationRecommendation = EC2ReservationRecommendation | RDSReservationRecommendation;

export interface ReservationFilters {
  region?: string;
  instance_type?: string;
  platform?: string;
  database_engine?: string;
  multi_az?: boolean;
  service_type?: 'ec2' | 'rds' | 'elasticache' | 'opensearch' | 'redshift' | 'dynamodb' | 'lambda' | 'sagemaker';
  min_savings?: number;
}

// API functions for reservations
export const reservationsApi = {
  /**
   * Get all reservations for an organization
   */
  getAll: async (organizationId: string, filters?: ReservationFilters) => {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/organizations/${organizationId}/reservations${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<Reservation[]>(endpoint);
  },
  
  /**
   * Get reservations for a specific cloud account
   */
  getByCloudAccount: async (cloudAccountId: string, filters?: ReservationFilters) => {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/cloud-accounts/${cloudAccountId}/reservations${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<Reservation[]>(endpoint);
  },

  /**
   * Get reservation details by ID
   */
  getById: async (reservationId: string) => {
    return apiClient.get<Reservation>(`/reservations/${reservationId}`);
  },

  /**
   * Get recommendations for a reservation
   */
  getRecommendations: async (reservationId: string) => {
    return apiClient.get<ReservationRecommendation[]>(`/reservations/${reservationId}/recommendations`);
  },

  /**
   * Get reservation summary for an organization
   */
  getSummary: async (organizationId: string, serviceType?: string) => {
    let endpoint = `/organizations/${organizationId}/reservations/summary`;
    
    if (serviceType) {
      endpoint += `?service_type=${serviceType}`;
    }
    
    return apiClient.get<{
      total_potential_savings: number;
      total_instances: number;
      purchased_reservations: number;
      services_breakdown?: Record<string, { count: number; savings: number }>;
    }>(endpoint);
  },
  
  /**
   * Get EC2 reservations for an organization
   */
  getEC2Reservations: async (organizationId: string, filters?: ReservationFilters) => {
    const queryParams = new URLSearchParams();
    queryParams.append('service_type', 'ec2');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const endpoint = `/organizations/${organizationId}/reservations?${queryParams.toString()}`;
    return apiClient.get<EC2Reservation[]>(endpoint);
  },
  
  /**
   * Get RDS reservations for an organization
   */
  getRDSReservations: async (organizationId: string, filters?: ReservationFilters) => {
    const queryParams = new URLSearchParams();
    queryParams.append('service_type', 'rds');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const endpoint = `/organizations/${organizationId}/reservations?${queryParams.toString()}`;
    return apiClient.get<RDSReservation[]>(endpoint);
  },

  /**
   * Get reservation purchase options for a specific instance configuration
   */
  getPurchaseOptions: async (
    cloudAccountId: string, 
    instanceType: string, 
    quantity: number, 
    platform: string = 'Linux/UNIX'
  ) => {
    const queryParams = new URLSearchParams({
      instanceType,
      quantity: String(quantity),
      platform
    });
    
    return apiClient.get<ReservationRecommendation[]>(
      `/cloud-accounts/${cloudAccountId}/reservations/purchase-options?${queryParams.toString()}`
    );
  },
  
  /**
   * Get all reservations and savings opportunities
   */
  getAllReservations: async (organizationId: string, serviceType?: string) => {
    let endpoint = `/organizations/${organizationId}/reservations/all`;
    
    if (serviceType) {
      endpoint += `?service_type=${serviceType}`;
    }
    
    return apiClient.get<any[]>(endpoint);
  }
};