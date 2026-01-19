import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cloudAccountsApi, CreateCloudAccountDto, CloudAccount } from '@/lib/api';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { calculateRetryDelay } from '@/lib/error-handling';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook to fetch all cloud accounts for an organization
 */
export function useCloudAccounts(organizationId: string | null) {
  const { handleError } = useErrorHandler({
    context: { component: 'useCloudAccounts', organizationId }
  });
  
  return useQuery({
    queryKey: ['cloud-accounts', organizationId],
    queryFn: () => organizationId 
      ? cloudAccountsApi.getAll(organizationId)
      : Promise.reject('No organization ID provided'),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: calculateRetryDelay,
    onError: handleError
  });
}

/**
 * Hook to fetch a specific cloud account by ID
 */
export function useCloudAccount(id: string | null) {
  const { handleError } = useErrorHandler({
    context: { component: 'useCloudAccount', accountId: id }
  });
  
  return useQuery({
    queryKey: ['cloud-account', id],
    queryFn: () => id 
      ? cloudAccountsApi.getById(id)
      : Promise.reject('No cloud account ID provided'),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: calculateRetryDelay,
    onError: handleError
  });
}

/**
 * Hook to create a new cloud account
 */
export function useCreateCloudAccount() {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler({
    context: { component: 'useCreateCloudAccount' },
    showToast: true
  });

  return useMutation({
    mutationFn: ({ organizationId, data }: { organizationId: string, data: CreateCloudAccountDto }) => 
      cloudAccountsApi.create(organizationId, data),
    onSuccess: (newAccount, { organizationId }) => {
      // Show success toast
      toast({
        title: "Cloud account created",
        description: `Successfully created ${newAccount.name}`,
      });
      
      // Invalidate the cloud accounts list to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['cloud-accounts', organizationId] });
    },
    onError: (error, variables) => {
      handleError(error);
      // You can add additional context about the mutation that failed
      console.error('Failed to create cloud account:', variables);
    },
    retry: 1, // Only retry once for mutations to avoid duplicate creation
  });
}

/**
 * Hook to update a cloud account
 */
export function useUpdateCloudAccount() {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler({
    context: { component: 'useUpdateCloudAccount' },
    showToast: true
  });

  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<CreateCloudAccountDto> }) => 
      cloudAccountsApi.update(id, data),
    // Add optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cloud-account', id] });
      
      // Get the current account from cache
      const previousAccount = queryClient.getQueryData<CloudAccount>(['cloud-account', id]);
      
      if (previousAccount) {
        // Create optimistically updated account
        const optimisticAccount = {
          ...previousAccount,
          ...data,
          // Update the timestamp to current time
          updatedAt: new Date().toISOString(),
        };
        
        // Update the single account in the cache
        queryClient.setQueryData(['cloud-account', id], optimisticAccount);
        
        // If we have access to the accounts list, update it there as well
        if (previousAccount.organization_id) {
          const accountsList = queryClient.getQueryData<CloudAccount[]>(
            ['cloud-accounts', previousAccount.organization_id]
          );
          
          if (accountsList) {
            const updatedList = accountsList.map(account => 
              account.id === id ? optimisticAccount : account
            );
            
            queryClient.setQueryData(
              ['cloud-accounts', previousAccount.organization_id],
              updatedList
            );
          }
        }
        
        // Show immediate toast notification
        toast({
          title: "Account updated",
          description: `Updated ${previousAccount.name}`,
        });
      }
      
      // Return the previous account for rollback
      return { previousAccount };
    },
    onSuccess: (updatedAccount) => {
      // Update the specific cloud account in the cache with actual server data
      queryClient.setQueryData(['cloud-account', updatedAccount.id], updatedAccount);
      
      // Invalidate the cloud accounts list to reflect the updates
      if (updatedAccount.organization_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['cloud-accounts', updatedAccount.organization_id] 
        });
      }
    },
    onError: (error, variables, context) => {
      // Revert the optimistic update
      if (context?.previousAccount) {
        queryClient.setQueryData(
          ['cloud-account', context.previousAccount.id],
          context.previousAccount
        );
        
        if (context.previousAccount.organization_id) {
          // Invalidate to trigger a refresh of the list
          queryClient.invalidateQueries({
            queryKey: ['cloud-accounts', context.previousAccount.organization_id]
          });
        }
      }
      
      // Handle the error
      handleError(error);
      console.error('Failed to update cloud account:', variables.id);
      
      // Show error toast
      toast({
        title: "Update failed",
        description: "Failed to update the cloud account. Changes have been reverted.",
        variant: "destructive"
      });
    },
    retry: 1,
  });
}

/**
 * Hook to delete a cloud account
 */
export function useDeleteCloudAccount() {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler({
    context: { component: 'useDeleteCloudAccount' },
    showToast: true
  });

  return useMutation({
    mutationFn: (cloudAccount: { id: string, organizationId: string, name: string }) => 
      cloudAccountsApi.delete(cloudAccount.id),
    // Add optimistic update
    onMutate: async ({ id, organizationId, name }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cloud-accounts', organizationId] });
      await queryClient.cancelQueries({ queryKey: ['cloud-account', id] });
      
      // Get the current account from cache
      const previousAccount = queryClient.getQueryData<CloudAccount>(['cloud-account', id]);
      
      // Get the current accounts list from cache
      const previousAccounts = queryClient.getQueryData<CloudAccount[]>(
        ['cloud-accounts', organizationId]
      );
      
      // Optimistically remove account from list
      if (previousAccounts) {
        const updatedList = previousAccounts.filter(account => account.id !== id);
        queryClient.setQueryData(['cloud-accounts', organizationId], updatedList);
      }
      
      // Optimistically remove the account
      queryClient.removeQueries({ queryKey: ['cloud-account', id] });
      
      // Show immediate toast notification
      toast({
        title: "Account deleted",
        description: `${name} has been deleted`,
      });
      
      // Return previous state for rollback
      return { previousAccounts, previousAccount };
    },
    onSuccess: (_, { id, organizationId }) => {
      // The account is already removed optimistically, so no need to update the cache here
      // We could refetch to make sure we're in sync with the server, but not necessary
    },
    onError: (error, variables, context) => {
      // Revert optimistic deletion
      if (context?.previousAccount) {
        queryClient.setQueryData(['cloud-account', variables.id], context.previousAccount);
      }
      
      if (context?.previousAccounts) {
        queryClient.setQueryData(
          ['cloud-accounts', variables.organizationId],
          context.previousAccounts
        );
      }
      
      // Handle the error
      handleError(error);
      console.error('Failed to delete cloud account:', variables.id);
      
      // Show error toast
      toast({
        title: "Deletion failed",
        description: "Failed to delete the cloud account. The operation has been reverted.",
        variant: "destructive"
      });
    },
    // After error or success
    onSettled: (_, __, { organizationId }) => {
      // Refetch to ensure our cache is in sync with server state
      queryClient.invalidateQueries({ queryKey: ['cloud-accounts', organizationId] });
    },
    retry: 0, // Don't retry deletion operations
  });
}

/**
 * Hook to sync a cloud account with its cloud provider
 */
export function useSyncCloudAccount() {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler({
    context: { component: 'useSyncCloudAccount' },
    showToast: true
  });

  return useMutation({
    mutationFn: ({ id, organizationId }: { id: string, organizationId: string }) => 
      cloudAccountsApi.sync(id),
    // Add optimistic update
    onMutate: async ({ id, organizationId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cloud-account', id] });
      
      // Get the current account from cache
      const previousAccount = queryClient.getQueryData<CloudAccount>(['cloud-account', id]);
      
      if (previousAccount) {
        // Create optimistically updated account showing sync in progress
        const optimisticAccount = {
          ...previousAccount,
          status: 'syncing' as any, // Add temporary status
          updatedAt: new Date().toISOString(),
        };
        
        // Update the cache
        queryClient.setQueryData(['cloud-account', id], optimisticAccount);
        
        // Show immediate toast notification
        toast({
          title: "Sync initiated",
          description: `Syncing ${previousAccount.name} with cloud provider...`,
        });
      }
      
      // Return previous state for rollback
      return { previousAccount };
    },
    onSuccess: (_, { id, organizationId }) => {
      // Show success toast
      toast({
        title: "Sync completed",
        description: "Cloud account successfully synchronized",
      });
      
      // Invalidate relevant queries to reflect the new sync status
      queryClient.invalidateQueries({ queryKey: ['cloud-account', id] });
      queryClient.invalidateQueries({ queryKey: ['cloud-accounts', organizationId] });
      
      // Also invalidate resources since they might have changed after the sync
      queryClient.invalidateQueries({ queryKey: ['resources', id] });
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousAccount) {
        queryClient.setQueryData(['cloud-account', variables.id], context.previousAccount);
      }
      
      // Handle the error
      handleError(error);
      console.error('Failed to sync cloud account:', variables.id);
      
      // Show error toast
      toast({
        title: "Sync failed",
        description: "Failed to synchronize the cloud account.",
        variant: "destructive"
      });
    },
    retry: 2, // Retry sync operations, as they're idempotent
    retryDelay: calculateRetryDelay,
  });
}