import React from 'react';
import ResourceDiscoveryDashboard from '@/components/dashboard/ResourceDiscoveryDashboard';
import { useOrganizations } from '@/hooks/queries/use-organizations';
import { Loader2, AlertCircle } from 'lucide-react';

const DiscoveryTab = () => {
  // Fetch user's organizations
  const { data: organizations, isLoading: organizationsLoading, error: organizationsError } = useOrganizations();
  const organization = organizations?.[0];

  if (organizationsLoading) {
    return (
      <div className="bg-gray-50/30">
        <div className="bg-gradient-to-b from-gray-50/60 via-emerald-50/40 to-gray-50/30 p-6">
          <div className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm rounded-2xl p-12 border border-emerald-200/20">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mr-2" />
              <span className="text-gray-700 font-medium">Loading organization data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (organizationsError || !organization) {
    return (
      <div className="bg-gray-50/30">
        <div className="bg-gradient-to-b from-gray-50/60 via-emerald-50/40 to-gray-50/30 p-6">
          <div className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm rounded-2xl p-12 border border-emerald-200/20">
            <div className="flex items-center justify-center text-red-600">
              <AlertCircle className="h-8 w-8 mr-2" />
              <span className="font-medium">Failed to load organization data</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/30">
      <div className="bg-gradient-to-b from-gray-50/60 via-emerald-50/40 to-gray-50/30 p-6 border-b border-emerald-200/30">
        <div className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm rounded-2xl border border-emerald-200/20 overflow-hidden">
          <ResourceDiscoveryDashboard organizationId={organization.id} />
        </div>
      </div>
    </div>
  );
};

export default DiscoveryTab;