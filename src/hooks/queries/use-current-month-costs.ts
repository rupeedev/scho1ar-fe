import { useQuery } from '@tanstack/react-query';
import { costsApi } from '@/lib/api';

/**
 * Hook to fetch current month's AWS costs for cloud accounts
 */
export const useCurrentMonthCosts = (cloudAccountIds: string[], enabled: boolean = true) => {
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const startDate = startOfMonth.toISOString().split('T')[0];
  const endDate = endOfMonth.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['current-month-costs', cloudAccountIds, startDate, endDate],
    queryFn: async () => {
      if (!cloudAccountIds.length) return { totalCost: 0, costByAccount: {} };

      try {
        // Fetch costs for all cloud accounts
        const costPromises = cloudAccountIds.map(async (accountId) => {
          try {
            const costs = await costsApi.getAwsCosts(
              accountId,
              startDate,
              endDate,
              'DAILY'
            );
            
            // Calculate total cost for this account
            let accountTotal = 0;
            if (costs?.resultsByTime) {
              costs.resultsByTime.forEach((result: any) => {
                const cost = result.Total?.UnblendedCost?.Amount;
                if (cost) {
                  accountTotal += parseFloat(cost);
                }
              });
            }
            
            return { accountId, cost: accountTotal };
          } catch (error) {
            console.warn(`Failed to fetch costs for account ${accountId}:`, error);
            return { accountId, cost: 0 };
          }
        });

        const accountCosts = await Promise.all(costPromises);
        
        // Calculate totals
        const totalCost = accountCosts.reduce((sum, account) => sum + account.cost, 0);
        const costByAccount = accountCosts.reduce((acc, { accountId, cost }) => {
          acc[accountId] = cost;
          return acc;
        }, {} as Record<string, number>);

        return { totalCost, costByAccount };
      } catch (error) {
        console.error('Error fetching current month costs:', error);
        return { totalCost: 0, costByAccount: {} };
      }
    },
    enabled: enabled && cloudAccountIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};