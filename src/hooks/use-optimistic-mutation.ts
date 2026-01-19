import { 
  useMutation, 
  useQueryClient, 
  MutationFunction,
  UseMutationOptions
} from '@tanstack/react-query';
import { useErrorHandler } from './use-error-handler';
import { toast } from '@/components/ui/use-toast';

/**
 * Generic type for defining the shape of an optimistic mutation context
 */
export interface OptimisticContext<TData> {
  previousData?: TData;
  additionalContext?: Record<string, any>;
}

/**
 * Custom hook for creating mutations with optimistic updates
 * 
 * @param options Configuration options for the optimistic mutation
 * @returns A configured useMutation hook
 */
export function useOptimisticMutation<
  TData,
  TError,
  TVariables,
  TContext extends OptimisticContext<any>
>({
  // Function to perform the actual mutation
  mutationFn,
  
  // Query key to manipulate
  queryKey,
  
  // Function to create the optimistic update
  getOptimisticData,
  
  // Function to invalidate queries after success
  invalidateQueries,
  
  // Toast messages
  toasts = {
    optimistic: { title: 'Processing...', description: 'Your request is being processed' },
    success: { title: 'Success', description: 'Operation completed successfully' },
    error: { title: 'Error', description: 'Operation failed' }
  },
  
  // Error handler options
  errorHandlerOptions = {
    context: { component: 'useOptimisticMutation' },
    showToast: false // We'll manage toasts separately in this hook
  },
  
  // Additional options for useMutation
  mutationOptions = {}
}: {
  mutationFn: MutationFunction<TData, TVariables>;
  queryKey: unknown[];
  getOptimisticData: (variables: TVariables, queryData?: any) => any;
  invalidateQueries?: (data: TData, variables: TVariables) => void;
  toasts?: {
    optimistic?: { title: string; description: string } | false;
    success?: { title: string; description: string } | false;
    error?: { title: string; description: string } | false;
  };
  errorHandlerOptions?: Parameters<typeof useErrorHandler>[0];
  mutationOptions?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 
    'mutationFn' | 'onMutate' | 'onSuccess' | 'onError' | 'onSettled'
  >;
}) {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler(errorHandlerOptions);

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    
    // Handle optimistic updates
    onMutate: async (variables) => {
      // Cancel any outgoing refetches for this query
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot the current value
      const previousData = queryClient.getQueryData<any>(queryKey);
      
      if (previousData) {
        // Apply optimistic update
        const optimisticData = getOptimisticData(variables, previousData);
        
        // Update the cache with optimistic data
        queryClient.setQueryData(queryKey, optimisticData);
        
        // Show optimistic toast if configured
        if (toasts.optimistic) {
          toast({
            title: toasts.optimistic.title,
            description: toasts.optimistic.description,
          });
        }
      }
      
      // Return context for potential rollback
      return { previousData } as TContext;
    },
    
    // Handle successful response
    onSuccess: (data, variables, context) => {
      // Update the cache with the actual server response
      queryClient.setQueryData(queryKey, data);
      
      // Invalidate related queries if needed
      if (invalidateQueries) {
        invalidateQueries(data, variables);
      }
      
      // Show success toast if configured
      if (toasts.success) {
        toast({
          title: toasts.success.title,
          description: toasts.success.description,
        });
      }
      
      // Call the original onSuccess if provided in mutationOptions
      if (mutationOptions.onSuccess) {
        mutationOptions.onSuccess(data, variables, context);
      }
    },
    
    // Handle errors
    onError: (error: TError, variables, context) => {
      // Revert to previous state if we have it
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      
      // Log and handle the error
      handleError(error);
      console.error('Mutation failed:', error);
      
      // Show error toast if configured
      if (toasts.error) {
        toast({
          title: toasts.error.title,
          description: toasts.error.description,
          variant: "destructive"
        });
      }
      
      // Call the original onError if provided in mutationOptions
      if (mutationOptions.onError) {
        mutationOptions.onError(error, variables, context);
      }
    },
    
    // Clean up after mutation regardless of outcome
    onSettled: (data, error, variables, context) => {
      // Invalidate to ensure consistency with server
      queryClient.invalidateQueries({ queryKey });
      
      // Call the original onSettled if provided in mutationOptions
      if (mutationOptions.onSettled) {
        mutationOptions.onSettled(data, error, variables, context);
      }
    },
    
    // Pass through other options
    ...mutationOptions
  });
}

/**
 * Example usage:
 * 
 * ```typescript
 * // In your component:
 * const updateMutation = useOptimisticMutation({
 *   mutationFn: (data: UpdateData) => api.update(data.id, data),
 *   queryKey: ['item', itemId],
 *   getOptimisticData: (variables) => ({ ...currentItem, ...variables }),
 *   invalidateQueries: () => queryClient.invalidateQueries(['items']),
 *   toasts: {
 *     optimistic: { title: 'Updating...', description: 'Your item is being updated' },
 *     success: { title: 'Item updated', description: 'Your item has been updated successfully' },
 *     error: { title: 'Update failed', description: 'Failed to update your item' }
 *   }
 * });
 * 
 * // Then use it:
 * updateMutation.mutate({ id: itemId, name: 'New name' });
 * ```
 */