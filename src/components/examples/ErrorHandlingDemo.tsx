import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { apiClient } from '@/lib/api/api-client';
import { ErrorBoundary } from '../ui/error-boundary';
import { ApiErrorBoundary } from '../ApiErrorBoundary';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { errorLogger } from '@/lib/error-logging';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// Mock API functions to demonstrate error handling
const mockApi = {
  // Function that simulates different API errors
  fetchWithError: async (errorType: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    switch (errorType) {
      case 'auth':
        const authError: any = new Error('Authentication failed');
        authError.status = 401;
        throw authError;
        
      case 'network':
        throw new TypeError('Failed to fetch: network error');
        
      case 'timeout':
        const timeoutError = new Error('Request timed out');
        timeoutError.name = 'TimeoutError';
        throw timeoutError;
        
      case 'validation':
        const validationError: any = new Error('Validation failed');
        validationError.status = 422;
        validationError.errors = { field: ['Invalid value'] };
        throw validationError;
        
      case 'rate-limit':
        const rateLimitError: any = new Error('Too many requests');
        rateLimitError.status = 429;
        throw rateLimitError;
        
      case 'server':
        const serverError: any = new Error('Internal server error');
        serverError.status = 500;
        throw serverError;
        
      case 'success':
        return { message: 'Operation successful', data: { id: 123 } };
        
      default:
        return { message: 'Default success response' };
    }
  }
};

// Component that demonstrates using React Query with error handling
const QueryErrorDemo: React.FC = () => {
  const [errorType, setErrorType] = useState('success');
  const queryClient = useQueryClient();
  
  // Error handler hook for manual error handling
  const { handleError } = useErrorHandler({
    context: { component: 'QueryErrorDemo' }
  });
  
  // Query with error handling
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['demo', errorType],
    queryFn: () => mockApi.fetchWithError(errorType),
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    enabled: false, // Don't run automatically
  });
  
  // Mutation with error handling
  const mutation = useMutation({
    mutationFn: (type: string) => mockApi.fetchWithError(type),
    onSuccess: () => {
      // Invalidate relevant queries on success
      queryClient.invalidateQueries({ queryKey: ['demo'] });
    },
    onError: (error) => {
      // Handle mutation errors
      handleError(error);
    }
  });
  
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="w-1/2">
          <Label htmlFor="error-type">Error Type</Label>
          <Select 
            value={errorType} 
            onValueChange={setErrorType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select error type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="auth">Authentication Error</SelectItem>
              <SelectItem value="network">Network Error</SelectItem>
              <SelectItem value="timeout">Timeout Error</SelectItem>
              <SelectItem value="validation">Validation Error</SelectItem>
              <SelectItem value="rate-limit">Rate Limit Error</SelectItem>
              <SelectItem value="server">Server Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex gap-4">
        <Button
          onClick={() => refetch()}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Run Query'}
        </Button>
        
        <Button
          onClick={() => mutation.mutate(errorType)}
          disabled={mutation.isPending}
          variant="outline"
        >
          {mutation.isPending ? 'Submitting...' : 'Run Mutation'}
        </Button>
        
        <Button
          onClick={() => {
            try {
              throw new Error('Manual error');
            } catch (err) {
              handleError(err);
            }
          }}
          variant="secondary"
        >
          Manual Error
        </Button>
      </div>
      
      {isError && (
        <div className="p-4 border border-red-200 rounded bg-red-50">
          <h3 className="font-medium text-red-800">Query Error:</h3>
          <pre className="text-sm text-red-700 mt-1">{(error as Error).message}</pre>
        </div>
      )}
      
      {mutation.isError && (
        <div className="p-4 border border-red-200 rounded bg-red-50">
          <h3 className="font-medium text-red-800">Mutation Error:</h3>
          <pre className="text-sm text-red-700 mt-1">{(mutation.error as Error).message}</pre>
        </div>
      )}
      
      {data && (
        <div className="p-4 border border-green-200 rounded bg-green-50">
          <h3 className="font-medium text-green-800">Success:</h3>
          <pre className="text-sm text-green-700 mt-1">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// Component to demonstrate API client error handling
const ApiClientDemo: React.FC = () => {
  const [endpoint, setEndpoint] = useState('/example');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Error handler
  const { handleError } = useErrorHandler();
  
  const makeRequest = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      // Make request with retry options
      const response = await apiClient.get(endpoint, {
        retry: {
          maxRetries: 2,
          retryDelay: 1000
        }
      });
      
      setResult({ success: true, data: response });
    } catch (error) {
      handleError(error);
      setResult({ success: false, error });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="w-full">
          <Label htmlFor="endpoint">API Endpoint</Label>
          <Input
            id="endpoint"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="/api/endpoint"
          />
          <p className="text-xs text-gray-500 mt-1">
            Note: This will attempt a real API call. Use a non-existent endpoint to see error handling.
          </p>
        </div>
      </div>
      
      <Button
        onClick={makeRequest}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Make API Request'}
      </Button>
      
      {result && (
        <div className={`p-4 border rounded ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <h3 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {result.success ? 'Success' : 'Error'}:
          </h3>
          <pre className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {JSON.stringify(result.data || result.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// Component that demonstrates error boundary usage
const ErrorBoundaryDemo: React.FC = () => {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Complete Error Handling Demo</CardTitle>
        <CardDescription>
          Explore different error handling techniques in Scho1ar Solution
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="query">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="query">React Query</TabsTrigger>
            <TabsTrigger value="api">API Client</TabsTrigger>
            <TabsTrigger value="boundary">Error Boundaries</TabsTrigger>
          </TabsList>
          
          <TabsContent value="query">
            <ApiErrorBoundary maxRetries={3}>
              <QueryErrorDemo />
            </ApiErrorBoundary>
          </TabsContent>
          
          <TabsContent value="api">
            <ApiErrorBoundary>
              <ApiClientDemo />
            </ApiErrorBoundary>
          </TabsContent>
          
          <TabsContent value="boundary">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Basic Error Boundary</h3>
                  <div className="border rounded p-4 min-h-[200px]">
                    <ErrorBoundary onError={(error) => errorLogger.logError(error)}>
                      <BuggyCounter />
                    </ErrorBoundary>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">API Error Boundary</h3>
                  <div className="border rounded p-4 min-h-[200px]">
                    <ApiErrorBoundary maxRetries={3}>
                      <BuggyFetch />
                    </ApiErrorBoundary>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-sm text-gray-500">
          Error logs are recorded to the console. Check developer tools to see details.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reset Demo
        </Button>
      </CardFooter>
    </Card>
  );
};

// A buggy counter that will crash after 5 clicks
const BuggyCounter: React.FC = () => {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    setCount(count + 1);
  };
  
  if (count === 5) {
    // Simulate a rendering error when count reaches 5
    throw new Error('Counter crashed at 5!');
  }
  
  return (
    <div className="text-center">
      <p className="mb-2">Count: {count}</p>
      <Button onClick={handleClick}>
        Increment
      </Button>
      <p className="text-xs text-gray-500 mt-4">
        This counter will crash when it reaches 5.
      </p>
    </div>
  );
};

// Component that will throw an error after a delay
const BuggyFetch: React.FC = () => {
  const [shouldError, setShouldError] = useState(false);
  
  React.useEffect(() => {
    if (shouldError) {
      // Simulate a network error
      const error: any = new Error('Failed to fetch data');
      error.status = 500;
      throw error;
    }
  }, [shouldError]);
  
  return (
    <div className="text-center">
      <Button 
        onClick={() => setShouldError(true)}
        disabled={shouldError}
      >
        Trigger API Error
      </Button>
      <p className="text-xs text-gray-500 mt-4">
        This will trigger an error that the ApiErrorBoundary will catch.
      </p>
    </div>
  );
};

export default ErrorBoundaryDemo;