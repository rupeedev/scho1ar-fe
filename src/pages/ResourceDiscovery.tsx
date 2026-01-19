import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ResourceDiscoveryDashboard from '@/components/dashboard/ResourceDiscoveryDashboard';
import { useOrganizations } from '@/hooks/queries/use-organizations';
import { Loader2, AlertCircle } from 'lucide-react';

const ResourceDiscovery = () => {
  // Fetch user's organizations
  const { data: organizations, isLoading: organizationsLoading, error: organizationsError } = useOrganizations();
  const organization = organizations?.[0];

  if (organizationsLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mr-2" />
              <span>Loading organization data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (organizationsError || !organization) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-8 w-8 mr-2" />
              <span>Failed to load organization data</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      {/* Main Dashboard Content */}
      <ResourceDiscoveryDashboard organizationId={organization.id} />
    </div>
  );
};

export default ResourceDiscovery;