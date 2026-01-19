import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi, CreateOrganizationDto, Organization } from '@/lib/api';

/**
 * Hook to fetch all organizations the current user belongs to
 */
export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a specific organization by ID
 */
export function useOrganization(id: string | null) {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: () => id ? organizationsApi.getById(id) : Promise.reject('No organization ID provided'),
    enabled: !!id, // Only run the query if the ID is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new organization
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationDto) => organizationsApi.create(data),
    onSuccess: () => {
      // Invalidate the organizations list cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

/**
 * Hook to update an organization
 */
export function useUpdateOrganization(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CreateOrganizationDto>) => organizationsApi.update(id, data),
    onSuccess: (updatedOrg) => {
      // Update the specific organization in the cache
      queryClient.setQueryData(['organizations', id], updatedOrg);
      
      // Invalidate the organizations list to update it with the new data
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

/**
 * Hook to delete an organization
 */
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => organizationsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate the organizations list cache
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      
      // Remove the specific organization from the cache
      queryClient.removeQueries({ queryKey: ['organizations', deletedId] });
    },
  });
}