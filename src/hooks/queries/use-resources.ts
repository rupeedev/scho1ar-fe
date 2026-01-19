import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resourcesApi, ResourceFilters, Resource } from '@/lib/api';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { calculateRetryDelay } from '@/lib/error-handling';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook to fetch all resources for a cloud account with optional filters
 */
export function useResources(cloudAccountId: string | null, filters?: ResourceFilters) {
  const { handleError } = useErrorHandler({
    context: { component: 'useResources', cloudAccountId, filters }
  });

  return useQuery({
    queryKey: ['resources', cloudAccountId, filters],
    queryFn: () => cloudAccountId 
      ? resourcesApi.getAll(cloudAccountId, filters)
      : Promise.reject('No cloud account ID provided'),
    enabled: !!cloudAccountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: calculateRetryDelay,
    onError: handleError
  });
}

/**
 * Hook to fetch a specific resource by ID
 */
export function useResource(resourceId: string | null) {
  const { handleError } = useErrorHandler({
    context: { component: 'useResource', resourceId }
  });

  return useQuery({
    queryKey: ['resource', resourceId],
    queryFn: () => resourceId 
      ? resourcesApi.getById(resourceId)
      : Promise.reject('No resource ID provided'),
    enabled: !!resourceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: calculateRetryDelay,
    onError: handleError
  });
}

/**
 * Hook to fetch resource metrics
 */
export function useResourceMetrics(
  resourceId: string | null,
  metricName: string,
  startTime: Date,
  endTime: Date,
  period: number = 300
) {
  const { handleError } = useErrorHandler({
    context: { component: 'useResourceMetrics', resourceId, metricName }
  });

  return useQuery({
    queryKey: ['resource-metrics', resourceId, metricName, startTime.toISOString(), endTime.toISOString(), period],
    queryFn: () => resourceId 
      ? resourcesApi.getMetrics(resourceId, metricName, startTime, endTime, period)
      : Promise.reject('No resource ID provided'),
    enabled: !!resourceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: calculateRetryDelay,
    onError: handleError
  });
}

/**
 * Hook to fetch resource cost history
 */
export function useResourceCostHistory(
  resourceId: string | null,
  startDate: string,
  endDate: string
) {
  const { handleError } = useErrorHandler({
    context: { component: 'useResourceCostHistory', resourceId }
  });

  return useQuery({
    queryKey: ['resource-cost-history', resourceId, startDate, endDate],
    queryFn: () => resourceId 
      ? resourcesApi.getCostHistory(resourceId, startDate, endDate)
      : Promise.reject('No resource ID provided'),
    enabled: !!resourceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: calculateRetryDelay,
    onError: handleError
  });
}

/**
 * Hook to fetch resource recommendations
 */
export function useResourceRecommendations(resourceId: string | null) {
  const { handleError } = useErrorHandler({
    context: { component: 'useResourceRecommendations', resourceId }
  });

  return useQuery({
    queryKey: ['resource-recommendations', resourceId],
    queryFn: () => resourceId 
      ? resourcesApi.getRecommendations(resourceId)
      : Promise.reject('No resource ID provided'),
    enabled: !!resourceId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 3,
    retryDelay: calculateRetryDelay,
    onError: handleError
  });
}

/**
 * Hook to start a resource
 */
export function useStartResource() {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler({
    context: { component: 'useStartResource' },
    showToast: true
  });

  return useMutation({
    mutationFn: (resourceId: string) => resourcesApi.start(resourceId),
    // Add optimistic update
    onMutate: async (resourceId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['resource', resourceId] });
      
      // Get the current resource
      const previousResource = queryClient.getQueryData<Resource>(['resource', resourceId]);
      
      if (previousResource) {
        // Create optimistically updated resource
        const optimisticResource = {
          ...previousResource,
          status: 'starting', // Transitional status
          lastStatusChangeAt: new Date().toISOString()
        };
        
        // Update the cache
        queryClient.setQueryData(['resource', resourceId], optimisticResource);
        
        // Update in the list if it exists
        const resourcesList = queryClient.getQueryData<Resource[]>(
          ['resources', previousResource.cloudAccountId]
        );
        
        if (resourcesList) {
          const updatedList = resourcesList.map(resource => 
            resource.id === resourceId ? optimisticResource : resource
          );
          
          queryClient.setQueryData(
            ['resources', previousResource.cloudAccountId],
            updatedList
          );
        }
        
        // Show toast
        toast({
          title: "Starting resource",
          description: `${previousResource.name} is being started...`,
        });
      }
      
      return { previousResource };
    },
    onSuccess: (updatedResource) => {
      // Update with the actual data from the server
      queryClient.setQueryData(['resource', updatedResource.id], updatedResource);
      
      // Show success toast
      toast({
        title: "Resource started",
        description: `${updatedResource.name} has been started successfully`,
      });
      
      // Invalidate the resources list
      queryClient.invalidateQueries({ 
        queryKey: ['resources', updatedResource.cloudAccountId] 
      });
    },
    onError: (error, resourceId, context) => {
      // Revert the optimistic update
      if (context?.previousResource) {
        queryClient.setQueryData(['resource', resourceId], context.previousResource);
        
        // Revert in the list if needed
        const resourcesList = queryClient.getQueryData<Resource[]>(
          ['resources', context.previousResource.cloudAccountId]
        );
        
        if (resourcesList) {
          const revertedList = resourcesList.map(resource => 
            resource.id === resourceId ? context.previousResource : resource
          );
          
          queryClient.setQueryData(
            ['resources', context.previousResource.cloudAccountId],
            revertedList
          );
        }
      }
      
      // Handle the error
      handleError(error);
      console.error('Failed to start resource:', resourceId);
      
      // Show error toast
      toast({
        title: "Start failed",
        description: "Failed to start the resource. Operation has been reverted.",
        variant: "destructive"
      });
    },
    retry: 1, // Retry once
  });
}

/**
 * Hook to stop a resource
 */
export function useStopResource() {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler({
    context: { component: 'useStopResource' },
    showToast: true
  });

  return useMutation({
    mutationFn: (resourceId: string) => resourcesApi.stop(resourceId),
    // Add optimistic update
    onMutate: async (resourceId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['resource', resourceId] });
      
      // Get the current resource
      const previousResource = queryClient.getQueryData<Resource>(['resource', resourceId]);
      
      if (previousResource) {
        // Create optimistically updated resource
        const optimisticResource = {
          ...previousResource,
          status: 'stopping', // Transitional status
          lastStatusChangeAt: new Date().toISOString()
        };
        
        // Update the cache
        queryClient.setQueryData(['resource', resourceId], optimisticResource);
        
        // Update in the list if it exists
        const resourcesList = queryClient.getQueryData<Resource[]>(
          ['resources', previousResource.cloudAccountId]
        );
        
        if (resourcesList) {
          const updatedList = resourcesList.map(resource => 
            resource.id === resourceId ? optimisticResource : resource
          );
          
          queryClient.setQueryData(
            ['resources', previousResource.cloudAccountId],
            updatedList
          );
        }
        
        // Show toast
        toast({
          title: "Stopping resource",
          description: `${previousResource.name} is being stopped...`,
        });
      }
      
      return { previousResource };
    },
    onSuccess: (updatedResource) => {
      // Update with the actual data from the server
      queryClient.setQueryData(['resource', updatedResource.id], updatedResource);
      
      // Show success toast
      toast({
        title: "Resource stopped",
        description: `${updatedResource.name} has been stopped successfully`,
      });
      
      // Invalidate the resources list
      queryClient.invalidateQueries({ 
        queryKey: ['resources', updatedResource.cloudAccountId] 
      });
    },
    onError: (error, resourceId, context) => {
      // Revert the optimistic update
      if (context?.previousResource) {
        queryClient.setQueryData(['resource', resourceId], context.previousResource);
        
        // Revert in the list if needed
        const resourcesList = queryClient.getQueryData<Resource[]>(
          ['resources', context.previousResource.cloudAccountId]
        );
        
        if (resourcesList) {
          const revertedList = resourcesList.map(resource => 
            resource.id === resourceId ? context.previousResource : resource
          );
          
          queryClient.setQueryData(
            ['resources', context.previousResource.cloudAccountId],
            revertedList
          );
        }
      }
      
      // Handle the error
      handleError(error);
      console.error('Failed to stop resource:', resourceId);
      
      // Show error toast
      toast({
        title: "Stop failed",
        description: "Failed to stop the resource. Operation has been reverted.",
        variant: "destructive"
      });
    },
    retry: 1, // Retry once
  });
}

/**
 * Hook to update resource tags
 */
export function useUpdateResourceTags() {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler({
    context: { component: 'useUpdateResourceTags' },
    showToast: true
  });

  return useMutation({
    mutationFn: ({ resourceId, tags }: { resourceId: string, tags: Record<string, string> }) => 
      resourcesApi.updateTags(resourceId, tags),
    // Add optimistic update
    onMutate: async ({ resourceId, tags }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['resource', resourceId] });
      
      // Get the current resource
      const previousResource = queryClient.getQueryData<Resource>(['resource', resourceId]);
      
      if (previousResource) {
        // Create optimistically updated resource
        const optimisticResource = {
          ...previousResource,
          tags: { ...previousResource.tags, ...tags },
          updatedAt: new Date().toISOString()
        };
        
        // Update the cache
        queryClient.setQueryData(['resource', resourceId], optimisticResource);
        
        // Update in the list if it exists
        const resourcesList = queryClient.getQueryData<Resource[]>(
          ['resources', previousResource.cloudAccountId]
        );
        
        if (resourcesList) {
          const updatedList = resourcesList.map(resource => 
            resource.id === resourceId ? optimisticResource : resource
          );
          
          queryClient.setQueryData(
            ['resources', previousResource.cloudAccountId],
            updatedList
          );
        }
        
        // Show toast
        toast({
          title: "Tags updated",
          description: `Tags for ${previousResource.name} have been updated`,
        });
      }
      
      return { previousResource };
    },
    onSuccess: (updatedResource) => {
      // Update the cache with the server response
      queryClient.setQueryData(['resource', updatedResource.id], updatedResource);
      
      // Invalidate the resources list
      queryClient.invalidateQueries({ 
        queryKey: ['resources', updatedResource.cloudAccountId] 
      });
    },
    onError: (error, variables, context) => {
      // Revert the optimistic update
      if (context?.previousResource) {
        queryClient.setQueryData(['resource', variables.resourceId], context.previousResource);
        
        // Revert in the list if needed
        const resourcesList = queryClient.getQueryData<Resource[]>(
          ['resources', context.previousResource.cloudAccountId]
        );
        
        if (resourcesList) {
          const revertedList = resourcesList.map(resource => 
            resource.id === variables.resourceId ? context.previousResource : resource
          );
          
          queryClient.setQueryData(
            ['resources', context.previousResource.cloudAccountId],
            revertedList
          );
        }
      }
      
      // Handle the error
      handleError(error);
      console.error('Failed to update resource tags:', variables.resourceId);
      
      // Show error toast
      toast({
        title: "Tag update failed",
        description: "Failed to update tags. Changes have been reverted.",
        variant: "destructive"
      });
    },
    retry: 1,
  });
}

/**
 * Hook to assign a resource to a team
 */
export function useAssignResourceToTeam() {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler({
    context: { component: 'useAssignResourceToTeam' },
    showToast: true
  });

  return useMutation({
    mutationFn: ({ resourceId, teamId }: { resourceId: string, teamId: string }) => 
      resourcesApi.assignToTeam(resourceId, teamId),
    // Add optimistic update
    onMutate: async ({ resourceId, teamId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['resource', resourceId] });
      
      // Get the current resource
      const previousResource = queryClient.getQueryData<Resource>(['resource', resourceId]);
      
      if (previousResource) {
        // Create optimistically updated resource
        const optimisticResource = {
          ...previousResource,
          metadata: { 
            ...previousResource.metadata,
            teamId: teamId 
          },
          updatedAt: new Date().toISOString()
        };
        
        // Update the cache
        queryClient.setQueryData(['resource', resourceId], optimisticResource);
        
        // Show toast
        toast({
          title: "Team assignment",
          description: `${previousResource.name} is being assigned to the team...`,
        });
      }
      
      return { previousResource };
    },
    onSuccess: (updatedResource, { teamId }) => {
      // Update with the actual data from the server
      queryClient.setQueryData(['resource', updatedResource.id], updatedResource);
      
      // Show success toast
      toast({
        title: "Team assigned",
        description: `Resource has been assigned to the team successfully`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['resources', updatedResource.cloudAccountId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['team-resources', teamId] 
      });
    },
    onError: (error, variables, context) => {
      // Revert the optimistic update
      if (context?.previousResource) {
        queryClient.setQueryData(['resource', variables.resourceId], context.previousResource);
      }
      
      // Handle the error
      handleError(error);
      console.error('Failed to assign resource to team:', variables);
      
      // Show error toast
      toast({
        title: "Assignment failed",
        description: "Failed to assign the resource to the team.",
        variant: "destructive"
      });
    },
    retry: 1,
  });
}

/**
 * Hook to remove a resource from a team
 */
export function useRemoveResourceFromTeam() {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler({
    context: { component: 'useRemoveResourceFromTeam' },
    showToast: true
  });

  return useMutation({
    mutationFn: ({ resourceId, cloudAccountId }: { resourceId: string, cloudAccountId: string }) => 
      resourcesApi.removeFromTeam(resourceId),
    // Add optimistic update
    onMutate: async ({ resourceId, cloudAccountId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['resource', resourceId] });
      
      // Get the current resource
      const previousResource = queryClient.getQueryData<Resource>(['resource', resourceId]);
      
      if (previousResource) {
        // Create optimistically updated resource - remove teamId from metadata
        const { teamId, ...restMetadata } = previousResource.metadata || {};
        const optimisticResource = {
          ...previousResource,
          metadata: restMetadata,
          updatedAt: new Date().toISOString()
        };
        
        // Update the cache
        queryClient.setQueryData(['resource', resourceId], optimisticResource);
        
        // Show toast
        toast({
          title: "Removing from team",
          description: `${previousResource.name} is being removed from the team...`,
        });
      }
      
      return { previousResource };
    },
    onSuccess: (_, { resourceId, cloudAccountId }) => {
      // Show success toast
      toast({
        title: "Removed from team",
        description: "Resource has been removed from the team successfully",
      });
      
      // Invalidate the resource and resources list
      queryClient.invalidateQueries({ queryKey: ['resource', resourceId] });
      queryClient.invalidateQueries({ queryKey: ['resources', cloudAccountId] });
      
      // Invalidate team resources lists
      queryClient.invalidateQueries({ queryKey: ['team-resources'] });
    },
    onError: (error, variables, context) => {
      // Revert the optimistic update
      if (context?.previousResource) {
        queryClient.setQueryData(['resource', variables.resourceId], context.previousResource);
      }
      
      // Handle the error
      handleError(error);
      console.error('Failed to remove resource from team:', variables);
      
      // Show error toast
      toast({
        title: "Removal failed",
        description: "Failed to remove the resource from the team.",
        variant: "destructive"
      });
    },
    retry: 1,
  });
}