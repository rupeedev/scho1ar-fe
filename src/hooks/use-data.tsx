import { useState, useEffect } from 'react';
import { useSupabaseAuth } from './use-supabase-auth';
import { supabase } from '@/lib/supabase';

// Organization hooks
export function useOrganization() {
  const { user } = useSupabaseAuth();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!user) {
        setOrganization(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // First, get the user's organization_id
        const { data: userData, error: userError } = await supabase
          .from('app_users')
          .select('organization_id')
          .eq('id', user.id)
          .maybeSingle();
        
        if (userError) throw userError;
        
        if (!userData) {
          setOrganization(null);
          return;
        }
        
        // Then get the organization details
        const { data, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userData.organization_id)
          .maybeSingle();
        
        if (orgError) throw orgError;
        
        setOrganization(data);
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch organization'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [user]);

  return { organization, loading, error };
}

// Cloud Accounts hooks
export function useCloudAccounts(organizationId?: string) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!organizationId) {
        setAccounts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('cloud_accounts')
          .select('*')
          .eq('organization_id', organizationId);
        
        if (fetchError) throw fetchError;
        
        setAccounts(data || []);
      } catch (err) {
        console.error('Error fetching cloud accounts:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch cloud accounts'));
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [organizationId]);

  return { accounts, loading, error };
}

// Resources hooks
export function useResources(cloudAccountId?: string) {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      if (!cloudAccountId) {
        setResources([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('resources')
          .select('*')
          .eq('cloud_account_id', cloudAccountId);
        
        if (fetchError) throw fetchError;
        
        setResources(data || []);
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch resources'));
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [cloudAccountId]);

  return { resources, loading, error };
}

// Cost trend hooks
export function useCostTrend(
  organizationId?: string,
  startDate?: string,
  endDate?: string,
  granularity: 'DAILY' | 'MONTHLY' = 'DAILY'
) {
  const [costData, setCostData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCostTrend = async () => {
      if (!organizationId || !startDate || !endDate) {
        setCostData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
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
        
        if (fetchError) throw fetchError;
        
        setCostData(data || []);
      } catch (err) {
        console.error('Error fetching cost trend:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch cost trend'));
      } finally {
        setLoading(false);
      }
    };

    fetchCostTrend();
  }, [organizationId, startDate, endDate, granularity]);

  return { costData, loading, error };
}

// Schedules hooks
export function useSchedules(organizationId?: string) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!organizationId) {
        setSchedules([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('schedules')
          .select(`
            *,
            scheduled_resources(
              resource_id
            )
          `)
          .eq('organization_id', organizationId);
        
        if (fetchError) throw fetchError;
        
        setSchedules(data || []);
      } catch (err) {
        console.error('Error fetching schedules:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch schedules'));
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [organizationId]);

  return { schedules, loading, error };
}

// Teams hooks
export function useTeams(organizationId?: string) {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!organizationId) {
        setTeams([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('teams')
          .select(`
            *,
            team_members(
              user_id,
              role_in_team
            )
          `)
          .eq('organization_id', organizationId);
        
        if (fetchError) throw fetchError;
        
        setTeams(data || []);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch teams'));
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [organizationId]);

  return { teams, loading, error };
}