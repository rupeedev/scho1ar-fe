import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Custom function to fetch current user profile
export const getUserProfile = async (userId: string) => {
  try {
    // This method works better with RLS
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .filter('id', 'eq', userId)
      .maybeSingle();
    
    return { data, error };
  } catch (err) {
    console.error('Error in getUserProfile:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
};

// Authentication helper functions
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
};

// Organization helpers
export const getUserOrganizations = async () => {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    return { data: null, error: new Error('Not authenticated') };
  }
  
  const { data: appUser, error: appUserError } = await supabase
    .from('app_users')
    .select('organization_id')
    .filter('id', 'eq', userData.user.id)
    .maybeSingle();
  
  if (appUserError || !appUser) {
    return { data: null, error: appUserError || new Error('User has no organization') };
  }
  
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', appUser.organization_id)
    .maybeSingle();
  
  return { data: organization, error: orgError };
};

// Cloud accounts helpers
export const getCloudAccounts = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('cloud_accounts')
    .select('*')
    .eq('organization_id', organizationId);
  
  return { data, error };
};

// Resources helpers
export const getResources = async (cloudAccountId: string) => {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('cloud_account_id', cloudAccountId);
  
  return { data, error };
};

// Cost data helpers
export const getCostTrend = async (
  organizationId: string, 
  startDate: string, 
  endDate: string, 
  granularity: 'DAILY' | 'MONTHLY' = 'DAILY'
) => {
  const { data, error } = await supabase
    .from('cost_entries')
    .select(`
      id,
      date,
      cost,
      currency,
      service_name,
      cloud_accounts!inner(id, name, organization_id)
    `)
    .eq('cloud_accounts.organization_id', organizationId)
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('granularity', granularity);
  
  return { data, error };
};

// Schedules helpers
export const getSchedules = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      scheduled_resources(
        resource_id
      )
    `)
    .eq('organization_id', organizationId);
  
  return { data, error };
};

// Teams helpers
export const getTeams = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members(
        user_id,
        role_in_team
      )
    `)
    .eq('organization_id', organizationId);
  
  return { data, error };
};