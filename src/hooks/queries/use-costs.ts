import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { costsApi, CostFilter, CostGranularity, ForecastOptions } from '@/lib/api';
import { format } from 'date-fns';

/**
 * Hook to fetch cost trend data for an organization
 */
export function useCostTrend(
  organizationId: string | null,
  startDate: Date,
  endDate: Date,
  granularity: CostGranularity = 'DAILY',
  filters?: CostFilter,
  groupBy?: string
) {
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: [
      'cost-trend', 
      organizationId, 
      formattedStartDate, 
      formattedEndDate, 
      granularity,
      filters,
      groupBy
    ],
    queryFn: () => organizationId 
      ? costsApi.getCostTrend(
          organizationId, 
          formattedStartDate, 
          formattedEndDate, 
          granularity, 
          filters, 
          groupBy
        )
      : Promise.reject('No organization ID provided'),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch cloud health metrics
 */
export function useCloudHealth(organizationId: string | null) {
  return useQuery({
    queryKey: ['cloud-health', organizationId],
    queryFn: () => organizationId 
      ? costsApi.getCloudHealth(organizationId)
      : Promise.reject('No organization ID provided'),
    enabled: !!organizationId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to fetch optimization lab data
 */
export function useOptimizationLab(organizationId: string | null) {
  return useQuery({
    queryKey: ['optimization-lab', organizationId],
    queryFn: () => organizationId 
      ? costsApi.getOptimizationLab(organizationId)
      : Promise.reject('No organization ID provided'),
    enabled: !!organizationId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch previous period cost data for comparison
 */
export function usePreviousPeriodCosts(
  organizationId: string | null,
  startDate: Date,
  endDate: Date,
  daysDifference: number
) {
  // Calculate dates for previous period
  const prevStart = new Date(startDate);
  prevStart.setDate(prevStart.getDate() - daysDifference);
  
  const prevEnd = new Date(endDate);
  prevEnd.setDate(prevEnd.getDate() - daysDifference);
  
  const formattedPrevStart = format(prevStart, 'yyyy-MM-dd');
  const formattedPrevEnd = format(prevEnd, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: [
      'cost-trend-previous', 
      organizationId, 
      formattedPrevStart, 
      formattedPrevEnd
    ],
    queryFn: () => organizationId 
      ? costsApi.getCostTrend(
          organizationId, 
          formattedPrevStart, 
          formattedPrevEnd, 
          'DAILY'
        )
      : Promise.reject('No organization ID provided'),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch AWS costs for a specific cloud account
 */
export function useAwsCosts(
  cloudAccountId: string | null,
  startDate: Date,
  endDate: Date,
  granularity: 'DAILY' | 'MONTHLY' = 'DAILY',
  groupBy?: 'SERVICE' | 'REGION' | 'RESOURCE' | 'TAG',
  groupByKey?: string
) {
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: [
      'aws-costs', 
      cloudAccountId, 
      formattedStartDate, 
      formattedEndDate, 
      granularity,
      groupBy,
      groupByKey
    ],
    queryFn: () => cloudAccountId 
      ? costsApi.getAwsCosts(
          cloudAccountId, 
          formattedStartDate, 
          formattedEndDate, 
          granularity, 
          groupBy, 
          groupByKey
        )
      : Promise.reject('No cloud account ID provided'),
    enabled: !!cloudAccountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch cost trend data with forecast for an organization
 */
export function useCostTrendWithForecast(
  organizationId: string | null,
  startDate: Date,
  endDate: Date,
  granularity: CostGranularity = 'DAILY',
  filters?: CostFilter,
  groupBy?: string,
  forecastOptions?: ForecastOptions
) {
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: [
      'cost-trend-with-forecast', 
      organizationId, 
      formattedStartDate, 
      formattedEndDate, 
      granularity,
      filters,
      groupBy,
      forecastOptions
    ],
    queryFn: () => organizationId 
      ? costsApi.getCostTrendWithForecast(
          organizationId, 
          formattedStartDate, 
          formattedEndDate, 
          granularity, 
          filters, 
          groupBy,
          forecastOptions
        )
      : Promise.reject('No organization ID provided'),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 60 * 1000, // 30 minutes for auto refresh
  });
}

/**
 * Hook to fetch utilization metrics
 */
export function useUtilizationMetrics(
  organizationId: string | null,
  startDate: Date,
  endDate: Date
) {
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['utilization-metrics', organizationId, formattedStartDate, formattedEndDate],
    queryFn: () => organizationId 
      ? costsApi.getUtilizationMetrics(organizationId, formattedStartDate, formattedEndDate)
      : Promise.reject('No organization ID provided'),
    enabled: !!organizationId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to fetch savings data
 */
export function useSavingsData(
  organizationId: string | null,
  startDate: Date,
  endDate: Date
) {
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['savings-data', organizationId, formattedStartDate, formattedEndDate],
    queryFn: () => organizationId 
      ? costsApi.getSavingsData(organizationId, formattedStartDate, formattedEndDate)
      : Promise.reject('No organization ID provided'),
    enabled: !!organizationId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to fetch resource counts
 */
export function useResourceCounts(
  organizationId: string | null,
  startDate: Date,
  endDate: Date
) {
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['resource-counts', organizationId, formattedStartDate, formattedEndDate],
    queryFn: () => organizationId 
      ? costsApi.getResourceCounts(organizationId, formattedStartDate, formattedEndDate)
      : Promise.reject('No organization ID provided'),
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to trigger cost data sync from AWS
 */
export function useSyncCostData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      organizationId, 
      startDate, 
      endDate, 
      granularity 
    }: {
      organizationId: string;
      startDate?: string;
      endDate?: string;
      granularity?: 'DAILY' | 'MONTHLY';
    }) => costsApi.syncCostData(organizationId, startDate, endDate, granularity),
    onSuccess: () => {
      // Invalidate cost-related queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['cost-trend'] });
      queryClient.invalidateQueries({ queryKey: ['cost-trend-with-forecast'] });
    },
  });
}

/**
 * Hook to get sync status
 */
export function useSyncStatus(organizationId: string | null) {
  return useQuery({
    queryKey: ['sync-status', organizationId],
    queryFn: () => organizationId 
      ? costsApi.getSyncStatus(organizationId)
      : Promise.reject('No organization ID provided'),
    enabled: !!organizationId,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds when active
  });
}