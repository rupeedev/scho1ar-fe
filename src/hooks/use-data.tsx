import { useState, useEffect } from 'react';
import { useClerkAuth } from './use-clerk-auth';
import { organizationsApi, Organization } from '@/lib/api/organizations';
import { cloudAccountsApi, CloudAccount } from '@/lib/api/cloud-accounts';
import { resourcesApi, Resource } from '@/lib/api/resources';
import { teamsApi, Team } from '@/lib/api/teams';
import { schedulesApi, Schedule } from '@/lib/api/schedules';
import { costsApi, CostData } from '@/lib/api/costs';

// Organization hooks - uses backend API
export function useOrganization() {
  const { user, isSignedIn } = useClerkAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!isSignedIn) {
        setOrganization(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get user's organizations via backend API
        const organizations = await organizationsApi.getAll();

        if (organizations && organizations.length > 0) {
          setOrganization(organizations[0]);
          // Store organization ID for API client header
          localStorage.setItem('organizationId', organizations[0].id);
        } else {
          setOrganization(null);
        }
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch organization'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [isSignedIn]);

  return { organization, loading, error };
}

// Cloud Accounts hooks - uses backend API
export function useCloudAccounts(organizationId?: string) {
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
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
        const data = await cloudAccountsApi.getAll(organizationId);
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

// Resources hooks - uses backend API
export function useResources(cloudAccountId?: string) {
  const [resources, setResources] = useState<Resource[]>([]);
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
        const data = await resourcesApi.getAll(cloudAccountId);
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

// Cost trend hooks - uses backend API
export function useCostTrend(
  organizationId?: string,
  startDate?: string,
  endDate?: string,
  granularity: 'DAILY' | 'MONTHLY' = 'DAILY'
) {
  const [costData, setCostData] = useState<CostData[]>([]);
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
        const data = await costsApi.getCostTrend(
          organizationId,
          startDate,
          endDate,
          granularity
        );
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

// Schedules hooks - uses backend API
export function useSchedules(organizationId?: string) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
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
        // The schedules API gets schedules based on organization context from JWT
        const data = await schedulesApi.getAll();
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

// Teams hooks - uses backend API
export function useTeams(organizationId?: string) {
  const [teams, setTeams] = useState<Team[]>([]);
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
        const data = await teamsApi.getAll(organizationId);
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
