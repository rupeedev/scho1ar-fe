import React from 'react';
import { Network, DollarSign, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { cloudAccountsApi } from '@/lib/api/cloud-accounts';

interface NetworkTopologySummaryProps {
  accountId: string;
}

const NetworkTopologySummary: React.FC<NetworkTopologySummaryProps> = ({ accountId }) => {
  // Fetch network topology data for summary stats
  const { data: topologyData, isLoading } = useQuery({
    queryKey: ['network-topology', accountId],
    queryFn: () => cloudAccountsApi.getNetworkTopology(accountId),
    enabled: !!accountId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = topologyData?.stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Discovered Networks</p>
              <p className="text-2xl font-bold text-cyan-600">
                {stats?.totalVpcs ?? 0}
              </p>
            </div>
            <Network className="h-8 w-8 text-cyan-500 opacity-20" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Network Cost</p>
              <p className="text-2xl font-bold text-green-600">
                ${stats?.totalCost?.toFixed(2) ?? '0.00'}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resources Mapped</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats?.totalResources ?? 0}
              </p>
            </div>
            <Eye className="h-8 w-8 text-purple-500 opacity-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkTopologySummary;