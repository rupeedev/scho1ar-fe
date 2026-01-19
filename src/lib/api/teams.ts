import { apiClient } from './api-client';

// Types for request and response payloads
export interface Team {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  resource_count: number;
  schedule_count: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export type TeamRole = 'admin' | 'member' | 'viewer';

export interface CreateTeamDto {
  name: string;
  description?: string;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
}

export interface AddTeamMemberDto {
  user_id: string;
  role: TeamRole;
}

export interface UpdateTeamMemberDto {
  role: TeamRole;
}

export interface TeamResource {
  id: string;
  team_id: string;
  resource_id: string;
  created_at: string;
  resource?: {
    id: string;
    resource_name: string;
    resource_type: string;
    cloud_account_id: string;
    region: string;
  };
}

export interface TeamResourceDto {
  resource_id: string;
}

export interface TeamSchedule {
  id: string;
  team_id: string;
  schedule_id: string;
  created_at: string;
  schedule?: {
    id: string;
    name: string;
    description?: string;
    active: boolean;
  };
}

export interface TeamScheduleDto {
  schedule_id: string;
}

export interface TeamFilter {
  name?: string;
  member_id?: string;
  resource_id?: string;
  schedule_id?: string;
}

// API functions for teams
export const teamsApi = {
  /**
   * Get all teams for an organization
   */
  getAll: async (organizationId: string, filters?: TeamFilter) => {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/organizations/${organizationId}/teams${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<Team[]>(endpoint);
  },
  
  /**
   * Get team by ID
   */
  getById: async (teamId: string) => {
    return apiClient.get<Team>(`/teams/${teamId}`);
  },
  
  /**
   * Create a new team
   */
  create: async (organizationId: string, data: CreateTeamDto) => {
    return apiClient.post<Team>(`/organizations/${organizationId}/teams`, data);
  },
  
  /**
   * Update team details
   */
  update: async (teamId: string, data: UpdateTeamDto) => {
    return apiClient.patch<Team>(`/teams/${teamId}`, data);
  },
  
  /**
   * Delete a team
   */
  delete: async (teamId: string) => {
    return apiClient.delete<void>(`/teams/${teamId}`);
  },
  
  /**
   * Get all members of a team
   */
  getMembers: async (teamId: string) => {
    return apiClient.get<TeamMember[]>(`/teams/${teamId}/members`);
  },
  
  /**
   * Add a member to a team
   */
  addMember: async (teamId: string, data: AddTeamMemberDto) => {
    return apiClient.post<TeamMember>(`/teams/${teamId}/members`, data);
  },
  
  /**
   * Update a team member's role
   */
  updateMember: async (teamId: string, userId: string, data: UpdateTeamMemberDto) => {
    return apiClient.patch<TeamMember>(`/teams/${teamId}/members/${userId}`, data);
  },
  
  /**
   * Remove a member from a team
   */
  removeMember: async (teamId: string, userId: string) => {
    return apiClient.delete<void>(`/teams/${teamId}/members/${userId}`);
  },
  
  /**
   * Get all resources assigned to a team
   */
  getResources: async (teamId: string) => {
    return apiClient.get<TeamResource[]>(`/teams/${teamId}/resources`);
  },
  
  /**
   * Assign a resource to a team
   */
  addResource: async (teamId: string, data: TeamResourceDto) => {
    return apiClient.post<TeamResource>(`/teams/${teamId}/resources`, data);
  },
  
  /**
   * Remove a resource from a team
   */
  removeResource: async (teamId: string, resourceId: string) => {
    return apiClient.delete<void>(`/teams/${teamId}/resources/${resourceId}`);
  },
  
  /**
   * Get all schedules assigned to a team
   */
  getSchedules: async (teamId: string) => {
    return apiClient.get<TeamSchedule[]>(`/teams/${teamId}/schedules`);
  },
  
  /**
   * Assign a schedule to a team
   */
  addSchedule: async (teamId: string, data: TeamScheduleDto) => {
    return apiClient.post<TeamSchedule>(`/teams/${teamId}/schedules`, data);
  },
  
  /**
   * Remove a schedule from a team
   */
  removeSchedule: async (teamId: string, scheduleId: string) => {
    return apiClient.delete<void>(`/teams/${teamId}/schedules/${scheduleId}`);
  }
};