export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      app_settings: {
        Row: {
          settings_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          settings_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          settings_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          }
        ]
      }
      app_users: {
        Row: {
          app_role: string
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          app_role?: string
          avatar_url?: string | null
          created_at?: string
          display_name: string
          email: string
          id: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          app_role?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          details: Json | null
          id: number
          ip_address: unknown | null
          organization_id: string | null
          target_resource_id: string | null
          target_resource_type: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          details?: Json | null
          id?: number
          ip_address?: unknown | null
          organization_id?: string | null
          target_resource_id?: string | null
          target_resource_type?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          details?: Json | null
          id?: number
          ip_address?: unknown | null
          organization_id?: string | null
          target_resource_id?: string | null
          target_resource_type?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          }
        ]
      }
      cloud_accounts: {
        Row: {
          access_type: string
          account_id_on_provider: string
          created_at: string
          credentials_vault_id: string | null
          id: string
          last_synced_at: string | null
          name: string
          organization_id: string
          permission_type: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          access_type: string
          account_id_on_provider: string
          created_at?: string
          credentials_vault_id?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          organization_id: string
          permission_type?: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          access_type?: string
          account_id_on_provider?: string
          created_at?: string
          credentials_vault_id?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          organization_id?: string
          permission_type?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      cost_entries: {
        Row: {
          cloud_account_id: string
          cost: number
          currency: string
          date: string
          granularity: string
          id: number
          resource_id: string | null
          service_name: string
          usage_type: string
        }
        Insert: {
          cloud_account_id: string
          cost: number
          currency?: string
          date: string
          granularity: string
          id?: number
          resource_id?: string | null
          service_name: string
          usage_type: string
        }
        Update: {
          cloud_account_id?: string
          cost?: number
          currency?: string
          date?: string
          granularity?: string
          id?: number
          resource_id?: string | null
          service_name?: string
          usage_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_entries_cloud_account_id_fkey"
            columns: ["cloud_account_id"]
            isOneToOne: false
            referencedRelation: "cloud_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_entries_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          }
        ]
      }
      optimization_recommendations: {
        Row: {
          description: string
          details: Json
          generated_at: string
          id: string
          potential_monthly_savings: number | null
          resource_id: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          description: string
          details?: Json
          generated_at?: string
          id?: string
          potential_monthly_savings?: number | null
          resource_id: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          description?: string
          details?: Json
          generated_at?: string
          id?: string
          potential_monthly_savings?: number | null
          resource_id?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimization_recommendations_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          stripe_customer_id: string | null
          subscription_plan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          stripe_customer_id?: string | null
          subscription_plan?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          stripe_customer_id?: string | null
          subscription_plan?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      resources: {
        Row: {
          cloud_account_id: string
          discovered_at: string
          id: string
          last_seen_at: string
          metadata: Json
          name: string | null
          provider_resource_id: string
          region: string
          resource_type: string
          status_on_provider: string | null
          tags: Json
          team_id: string | null
        }
        Insert: {
          cloud_account_id: string
          discovered_at?: string
          id?: string
          last_seen_at?: string
          metadata?: Json
          name?: string | null
          provider_resource_id: string
          region: string
          resource_type: string
          status_on_provider?: string | null
          tags?: Json
          team_id?: string | null
        }
        Update: {
          cloud_account_id?: string
          discovered_at?: string
          id?: string
          last_seen_at?: string
          metadata?: Json
          name?: string | null
          provider_resource_id?: string
          region?: string
          resource_type?: string
          status_on_provider?: string | null
          tags?: Json
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_cloud_account_id_fkey"
            columns: ["cloud_account_id"]
            isOneToOne: false
            referencedRelation: "cloud_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      scheduled_resources: {
        Row: {
          resource_id: string
          schedule_id: string
        }
        Insert: {
          resource_id: string
          schedule_id: string
        }
        Update: {
          resource_id?: string
          schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_resources_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          }
        ]
      }
      schedules: {
        Row: {
          created_at: string
          definition: Json
          estimated_savings_percentage: number | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          schedule_mode: string
          team_id: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          definition?: Json
          estimated_savings_percentage?: number | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          schedule_mode?: string
          team_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          definition?: Json
          estimated_savings_percentage?: number | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          schedule_mode?: string
          team_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      team_members: {
        Row: {
          role_in_team: string
          team_id: string
          user_id: string
        }
        Insert: {
          role_in_team?: string
          team_id: string
          user_id: string
        }
        Update: {
          role_in_team?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          }
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}