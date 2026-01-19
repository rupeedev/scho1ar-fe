import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Network, DollarSign, Eye, Loader2, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useOrganizations } from '@/hooks/queries/use-organizations';
import { useQuery } from '@tanstack/react-query';
import { cloudAccountsApi } from '@/lib/api/cloud-accounts';
import NetworkTopologyDiagram from '@/components/network-topology/NetworkTopologyDiagram';
import NetworkTopologySummary from '@/components/network-topology/NetworkTopologySummary';

const Architecture = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Fetch user's organizations
  const { data: organizations, isLoading: organizationsLoading, error: organizationsError } = useOrganizations();
  const organization = organizations?.[0];

  // Fetch cloud accounts
  const { data: cloudAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['cloud-accounts', organization?.id],
    queryFn: () => cloudAccountsApi.getAll(organization!.id),
    enabled: !!organization?.id,
  });

  // Set first account as default if none selected
  React.useEffect(() => {
    if (cloudAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(cloudAccounts[0].id);
    }
  }, [cloudAccounts, selectedAccountId]);

  const selectedAccount = cloudAccounts.find(acc => acc.id === selectedAccountId);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 pb-8">
            {/* Page Title and Description */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Cloud Architecture</h1>
              <p className="text-gray-600">
                Visualize your cloud infrastructure with network topology and cost analysis diagrams
              </p>
            </div>

            {/* Account Selection */}
            {organizationsLoading || accountsLoading ? (
              <div className="flex items-center mb-6">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-600">Loading accounts...</span>
              </div>
            ) : organizationsError || !organization ? (
              <div className="flex items-center mb-6 text-red-600">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">Failed to load organization data</span>
              </div>
            ) : cloudAccounts.length === 0 ? (
              <div className="mb-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Cloud Accounts Found</h3>
                    <p className="text-gray-600 mb-4">
                      Add a cloud account to start visualizing your network topology.
                    </p>
                    <Link to="/add-account" className="text-blue-600 hover:text-blue-800">
                      Add Cloud Account
                    </Link>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Cloud Account:</label>
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select a cloud account" />
                      </SelectTrigger>
                      <SelectContent>
                        {cloudAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center space-x-2">
                              <span>{account.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {account.provider.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {account.region}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedAccount && (
                    <Badge variant={selectedAccount.status === 'active' ? 'default' : 'secondary'}>
                      {selectedAccount.status}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* Tabs for Network and Cost Views */}
            <Tabs defaultValue="network" className="w-full">
              <TabsList className="bg-transparent p-0 h-auto space-x-1 mb-6 border-b border-gray-200">
                <TabsTrigger
                  value="network"
                  className="border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 rounded-none px-4 py-2"
                >
                  <Network className="mr-2 h-4 w-4" />
                  Network Topology
                </TabsTrigger>
                <TabsTrigger
                  value="cost"
                  className="border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 rounded-none px-4 py-2"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Cost Analysis
                </TabsTrigger>
              </TabsList>
              
              {/* Network Topology View */}
              <TabsContent value="network">
                {selectedAccountId ? (
                  <NetworkTopologyDiagram accountId={selectedAccountId} />
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center justify-center h-96 text-center">
                        <Network className="h-16 w-16 text-cyan-500 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Select a Cloud Account</h2>
                        <p className="text-gray-600 max-w-md">
                          Choose a cloud account from the dropdown above to visualize its network topology.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Cost Analysis View */}
              <TabsContent value="cost">
                {selectedAccountId ? (
                  <NetworkTopologyDiagram accountId={selectedAccountId} />
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center justify-center h-96 text-center">
                        <div className="flex items-center mb-4">
                          <Network className="h-12 w-12 text-cyan-500" />
                          <DollarSign className="h-8 w-8 text-green-500 -ml-2" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Select a Cloud Account</h2>
                        <p className="text-gray-600 max-w-md">
                          Choose a cloud account from the dropdown above to visualize its network topology with cost overlays.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
            
            {/* Summary Cards - Only show when an account is selected */}
            {selectedAccountId && (
              <NetworkTopologySummary accountId={selectedAccountId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Architecture;