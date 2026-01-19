import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Loader2, Tag, Play, Square, RefreshCw, Trash } from 'lucide-react';
import { toast } from '../ui/use-toast';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';

// Mock data for cloud accounts
const MOCK_CLOUD_ACCOUNTS = [
  { 
    id: '1', 
    name: 'Production AWS', 
    provider: 'aws', 
    status: 'active',
    organization_id: 'org1',
    accountId: 'aws-123',
    lastSyncAt: '2023-04-01T12:00:00Z',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-04-01T12:00:00Z',
  },
  { 
    id: '2', 
    name: 'Staging AWS', 
    provider: 'aws', 
    status: 'active',
    organization_id: 'org1',
    accountId: 'aws-456',
    lastSyncAt: '2023-04-01T10:00:00Z',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-04-01T10:00:00Z',
  },
  { 
    id: '3', 
    name: 'Development GCP', 
    provider: 'gcp', 
    status: 'inactive',
    organization_id: 'org1',
    accountId: 'gcp-789',
    lastSyncAt: '2023-03-15T14:00:00Z',
    createdAt: '2023-02-10T00:00:00Z',
    updatedAt: '2023-03-15T14:00:00Z',
  }
];

// Mock data for resources
const MOCK_RESOURCES = [
  {
    id: '1',
    name: 'web-server-1',
    type: 'ec2',
    cloudAccountId: '1',
    status: 'running',
    region: 'us-west-2',
    instanceId: 'i-12345678',
    tags: { Environment: 'Production', Role: 'Web Server' },
    cost: { last30Days: 123.45, lastMonth: 115.20, forecastedThisMonth: 125.00, unit: 'USD' },
    createdAt: '2023-01-10T00:00:00Z',
    updatedAt: '2023-04-01T12:00:00Z',
    lastStatusChangeAt: '2023-04-01T12:00:00Z',
  },
  {
    id: '2',
    name: 'db-server-1',
    type: 'rds',
    cloudAccountId: '1',
    status: 'running',
    region: 'us-west-2',
    instanceId: 'db-87654321',
    tags: { Environment: 'Production', Role: 'Database' },
    cost: { last30Days: 245.67, lastMonth: 230.15, forecastedThisMonth: 250.00, unit: 'USD' },
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-04-01T12:00:00Z',
    lastStatusChangeAt: '2023-04-01T12:00:00Z',
  },
  {
    id: '3',
    name: 'staging-app',
    type: 'ec2',
    cloudAccountId: '2',
    status: 'stopped',
    region: 'us-east-1',
    instanceId: 'i-abcdefgh',
    tags: { Environment: 'Staging', Role: 'Application' },
    cost: { last30Days: 78.90, lastMonth: 110.25, forecastedThisMonth: 45.00, unit: 'USD' },
    createdAt: '2023-02-01T00:00:00Z',
    updatedAt: '2023-04-01T09:00:00Z',
    lastStatusChangeAt: '2023-04-01T09:00:00Z',
  }
];

// Mock API methods
const mockApi = {
  // Simulates a delay and potential failure
  simulateRequest: async <T,>(data: T, failureRate = 0.2): Promise<T> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    // Simulate random failures
    if (Math.random() < failureRate) {
      throw new Error('Random API failure for demonstration purposes');
    }
    
    return data;
  },
  
  // Cloud account methods
  cloudAccounts: {
    sync: async (id: string) => {
      const account = MOCK_CLOUD_ACCOUNTS.find(a => a.id === id);
      if (!account) throw new Error('Account not found');
      
      const updated = { 
        ...account, 
        lastSyncAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return mockApi.simulateRequest(updated);
    },
    
    update: async (id: string, data: Partial<typeof MOCK_CLOUD_ACCOUNTS[0]>) => {
      const account = MOCK_CLOUD_ACCOUNTS.find(a => a.id === id);
      if (!account) throw new Error('Account not found');
      
      const updated = { 
        ...account,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      return mockApi.simulateRequest(updated);
    },
    
    delete: async (id: string) => {
      const account = MOCK_CLOUD_ACCOUNTS.find(a => a.id === id);
      if (!account) throw new Error('Account not found');
      
      await mockApi.simulateRequest(undefined);
      return true;
    }
  },
  
  // Resource methods
  resources: {
    start: async (id: string) => {
      const resource = MOCK_RESOURCES.find(r => r.id === id);
      if (!resource) throw new Error('Resource not found');
      
      const updated = { 
        ...resource, 
        status: 'running',
        lastStatusChangeAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return mockApi.simulateRequest(updated);
    },
    
    stop: async (id: string) => {
      const resource = MOCK_RESOURCES.find(r => r.id === id);
      if (!resource) throw new Error('Resource not found');
      
      const updated = { 
        ...resource, 
        status: 'stopped',
        lastStatusChangeAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return mockApi.simulateRequest(updated);
    },
    
    updateTags: async (id: string, tags: Record<string, string>) => {
      const resource = MOCK_RESOURCES.find(r => r.id === id);
      if (!resource) throw new Error('Resource not found');
      
      const updated = { 
        ...resource, 
        tags: { ...resource.tags, ...tags },
        updatedAt: new Date().toISOString()
      };
      
      return mockApi.simulateRequest(updated);
    }
  }
};

// Cloud Account Item Component
const CloudAccountItem = ({ account, onSync, onDelete }: { 
  account: typeof MOCK_CLOUD_ACCOUNTS[0],
  onSync: (id: string) => void,
  onDelete: (id: string) => void
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  
  React.useEffect(() => {
    if (account.status === 'syncing') {
      setIsSyncing(true);
      const timer = setTimeout(() => setIsSyncing(false), 1500);
      return () => clearTimeout(timer);
    } else {
      setIsSyncing(false);
    }
  }, [account.status]);
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-md mb-2">
      <div>
        <div className="font-medium">{account.name}</div>
        <div className="text-sm text-gray-500">
          {account.provider.toUpperCase()} · 
          Last synced: {new Date(account.lastSyncAt).toLocaleString()}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge 
          variant={account.status === 'active' ? "success" : account.status === 'syncing' ? "outline" : "destructive"}
          className="mr-2"
        >
          {account.status === 'syncing' ? 'Syncing' : account.status}
        </Badge>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onSync(account.id)}
          disabled={isSyncing}
        >
          {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onDelete(account.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Resource Item Component
const ResourceItem = ({ resource, onStart, onStop, onUpdateTags }: { 
  resource: typeof MOCK_RESOURCES[0],
  onStart: (id: string) => void,
  onStop: (id: string) => void,
  onUpdateTags: (id: string, tags: Record<string, string>) => void
}) => {
  const [newTag, setNewTag] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  
  const isTransitioning = resource.status === 'starting' || resource.status === 'stopping';
  
  const handleAddTag = () => {
    if (newTag && newTagValue) {
      onUpdateTags(resource.id, { [newTag]: newTagValue });
      setNewTag('');
      setNewTagValue('');
    }
  };
  
  return (
    <div className="border rounded-md mb-4 overflow-hidden">
      <div className="bg-gray-50 p-3 flex justify-between items-center">
        <div>
          <span className="font-medium">{resource.name}</span>
          <span className="text-sm text-gray-500 ml-2">({resource.type})</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={
              resource.status === 'running' ? "success" : 
              resource.status === 'stopped' ? "secondary" :
              "outline"
            }
          >
            {resource.status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => resource.status === 'running' ? onStop(resource.id) : onStart(resource.id)}
            disabled={isTransitioning}
          >
            {isTransitioning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : resource.status === 'running' ? (
              <Square className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="p-3">
        <div className="mb-3">
          <div className="text-sm font-medium mb-1">Tags</div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(resource.tags || {}).map(([key, value]) => (
              <Badge key={key} variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" /> {key}: {value}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2 mt-2">
          <div className="flex-1">
            <Input
              placeholder="Tag Key"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Tag Value"
              value={newTagValue}
              onChange={(e) => setNewTagValue(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={handleAddTag} disabled={!newTag || !newTagValue}>
            Add Tag
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main Demo Component
export const OptimisticUIDemo = () => {
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    // Initialize mock data in the query cache for demo purposes
    queryClient.setQueryData(['demo', 'cloud-accounts'], MOCK_CLOUD_ACCOUNTS);
    queryClient.setQueryData(['demo', 'resources'], MOCK_RESOURCES);
  }, [queryClient]);
  
  const customizeToastBasedOnParams = (
    action: string, 
    entityName: string, 
    entityType: string
  ) => ({
    optimistic: { 
      title: `${action}ing ${entityType}...`,
      description: `${entityName} is being ${action.toLowerCase()}ed` 
    },
    success: { 
      title: `${entityType} ${action}ed`, 
      description: `${entityName} was successfully ${action.toLowerCase()}ed` 
    },
    error: { 
      title: `${action} failed`, 
      description: `Failed to ${action.toLowerCase()} ${entityName}` 
    }
  });
  
  // Cloud Account Mutations
  const syncCloudAccountMutation = useOptimisticMutation({
    mutationFn: mockApi.cloudAccounts.sync,
    queryKey: ['demo', 'cloud-accounts'],
    getOptimisticData: (id, accounts) => {
      return accounts.map(account => 
        account.id === id 
          ? { ...account, status: 'syncing', updatedAt: new Date().toISOString() }
          : account
      );
    },
    toasts: {
      optimistic: { title: 'Syncing account...', description: 'Cloud account is being synced' },
      success: { title: 'Account synced', description: 'Cloud account was successfully synced' },
      error: { title: 'Sync failed', description: 'Failed to sync cloud account' }
    }
  });
  
  const deleteCloudAccountMutation = useOptimisticMutation({
    mutationFn: mockApi.cloudAccounts.delete,
    queryKey: ['demo', 'cloud-accounts'],
    getOptimisticData: (id, accounts) => {
      return accounts.filter(account => account.id !== id);
    },
    toasts: {
      optimistic: { title: 'Deleting account...', description: 'Cloud account is being deleted' },
      success: { title: 'Account deleted', description: 'Cloud account was successfully deleted' },
      error: { title: 'Deletion failed', description: 'Failed to delete cloud account' }
    }
  });
  
  // Resource Mutations
  const startResourceMutation = useOptimisticMutation({
    mutationFn: mockApi.resources.start,
    queryKey: ['demo', 'resources'],
    getOptimisticData: (id, resources) => {
      return resources.map(resource => 
        resource.id === id 
          ? { 
              ...resource, 
              status: 'starting', 
              lastStatusChangeAt: new Date().toISOString(),
              updatedAt: new Date().toISOString() 
            }
          : resource
      );
    },
    toasts: {
      optimistic: { title: 'Starting resource...', description: 'Resource is starting up' },
      success: { title: 'Resource started', description: 'Resource was successfully started' },
      error: { title: 'Start failed', description: 'Failed to start resource' }
    }
  });
  
  const stopResourceMutation = useOptimisticMutation({
    mutationFn: mockApi.resources.stop,
    queryKey: ['demo', 'resources'],
    getOptimisticData: (id, resources) => {
      return resources.map(resource => 
        resource.id === id 
          ? { 
              ...resource, 
              status: 'stopping', 
              lastStatusChangeAt: new Date().toISOString(),
              updatedAt: new Date().toISOString() 
            }
          : resource
      );
    },
    toasts: {
      optimistic: { title: 'Stopping resource...', description: 'Resource is shutting down' },
      success: { title: 'Resource stopped', description: 'Resource was successfully stopped' },
      error: { title: 'Stop failed', description: 'Failed to stop resource' }
    }
  });
  
  const updateResourceTagsMutation = useOptimisticMutation({
    mutationFn: (params: { id: string, tags: Record<string, string> }) => 
      mockApi.resources.updateTags(params.id, params.tags),
    queryKey: ['demo', 'resources'],
    getOptimisticData: (params, resources) => {
      return resources.map(resource => 
        resource.id === params.id 
          ? { 
              ...resource, 
              tags: { ...resource.tags, ...params.tags },
              updatedAt: new Date().toISOString() 
            }
          : resource
      );
    },
    toasts: {
      optimistic: { title: 'Updating tags...', description: 'Resource tags are being updated' },
      success: { title: 'Tags updated', description: 'Resource tags were successfully updated' },
      error: { title: 'Update failed', description: 'Failed to update resource tags' }
    }
  });
  
  const cloudAccounts = queryClient.getQueryData<typeof MOCK_CLOUD_ACCOUNTS>(['demo', 'cloud-accounts']) || [];
  const resources = queryClient.getQueryData<typeof MOCK_RESOURCES>(['demo', 'resources']) || [];
  
  const [showFailures, setShowFailures] = useState(true);
  
  React.useEffect(() => {
    // Override the simulateRequest method based on showFailures
    const originalSimulateRequest = mockApi.simulateRequest;
    
    mockApi.simulateRequest = async <T,>(data: T, failureRate = 0): Promise<T> => {
      return originalSimulateRequest(data, showFailures ? 0.3 : 0);
    };
    
    return () => {
      mockApi.simulateRequest = originalSimulateRequest;
    };
  }, [showFailures]);
  
  const handleReset = () => {
    // Reset the demo data
    queryClient.setQueryData(['demo', 'cloud-accounts'], MOCK_CLOUD_ACCOUNTS);
    queryClient.setQueryData(['demo', 'resources'], MOCK_RESOURCES);
    
    toast({
      title: "Demo reset",
      description: "The demo data has been reset to its initial state"
    });
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Optimistic UI Updates Demo</CardTitle>
        <CardDescription>
          Experience how optimistic UI updates improve user experience by providing immediate feedback
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="show-failures" 
              checked={showFailures} 
              onCheckedChange={(checked) => setShowFailures(!!checked)} 
            />
            <Label htmlFor="show-failures" className="cursor-pointer">
              Simulate random failures (30% chance)
            </Label>
          </div>
          
          <Button variant="outline" onClick={handleReset}>
            Reset Demo
          </Button>
        </div>
        
        <Tabs defaultValue="accounts">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="accounts">Cloud Accounts</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="accounts" className="space-y-4">
            <div className="space-y-1">
              {cloudAccounts.map(account => (
                <CloudAccountItem 
                  key={account.id} 
                  account={account}
                  onSync={(id) => syncCloudAccountMutation.mutate(id)}
                  onDelete={(id) => deleteCloudAccountMutation.mutate(id)}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="resources" className="space-y-4">
            <div>
              {resources.map(resource => (
                <ResourceItem 
                  key={resource.id} 
                  resource={resource}
                  onStart={(id) => startResourceMutation.mutate(id)}
                  onStop={(id) => stopResourceMutation.mutate(id)}
                  onUpdateTags={(id, tags) => updateResourceTagsMutation.mutate({ id, tags })}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-gray-500">
          <p>
            Optimistic UI updates the interface before the server confirms the action,
            providing immediate feedback and a faster-feeling experience.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default OptimisticUIDemo;