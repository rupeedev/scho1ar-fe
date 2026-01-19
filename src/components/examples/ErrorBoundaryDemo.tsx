import React, { useState } from 'react';
import { ErrorBoundary } from '../ui/error-boundary';
import { ApiErrorBoundary } from '../ApiErrorBoundary';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ErrorType } from '@/lib/error-handling';

// Component that throws different types of errors for testing
const ErrorThrower: React.FC<{ errorType: string }> = ({ errorType }) => {
  React.useEffect(() => {
    if (errorType === 'none') return;
    
    const error = new Error(`Simulated ${errorType} error`);
    
    // Set specific error properties based on type
    switch (errorType) {
      case 'normal':
        throw error;
      case 'auth':
        Object.defineProperty(error, 'status', { value: 401 });
        throw error;
      case 'network':
        const networkError = new TypeError('Failed to fetch');
        throw networkError;
      case 'timeout':
        Object.defineProperty(error, 'name', { value: 'TimeoutError' });
        throw error;
      case 'rate-limit':
        Object.defineProperty(error, 'status', { value: 429 });
        throw error;
      case 'validation':
        Object.defineProperty(error, 'status', { value: 422 });
        throw error;
      case 'server':
        Object.defineProperty(error, 'status', { value: 500 });
        throw error;
      default:
        throw error;
    }
  }, [errorType]);
  
  return <div>No error thrown - this text should be visible</div>;
};

// Component to demonstrate error boundaries
export const ErrorBoundaryDemo: React.FC = () => {
  const [errorType, setErrorType] = useState<string>('none');
  const [boundaryType, setBoundaryType] = useState<'basic' | 'api'>('basic');
  
  const resetError = () => {
    setErrorType('none');
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Error Boundary Demo</CardTitle>
        <CardDescription>
          Test different error scenarios and how they are handled by error boundaries
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={boundaryType} onValueChange={(v) => setBoundaryType(v as 'basic' | 'api')}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="basic">Basic Error Boundary</TabsTrigger>
            <TabsTrigger value="api">API Error Boundary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setErrorType('normal')}>Throw Generic Error</Button>
              <Button onClick={() => setErrorType('network')}>Throw Network Error</Button>
            </div>
            
            <div className="min-h-[200px] border rounded-md p-4">
              <ErrorBoundary
                resetKeys={[errorType]}
                onError={(error) => console.log('Error caught by boundary:', error)}
              >
                <ErrorThrower errorType={errorType} />
              </ErrorBoundary>
            </div>
          </TabsContent>
          
          <TabsContent value="api" className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => setErrorType('auth')}>Auth Error</Button>
              <Button onClick={() => setErrorType('network')}>Network Error</Button>
              <Button onClick={() => setErrorType('timeout')}>Timeout Error</Button>
              <Button onClick={() => setErrorType('rate-limit')}>Rate Limit Error</Button>
              <Button onClick={() => setErrorType('validation')}>Validation Error</Button>
              <Button onClick={() => setErrorType('server')}>Server Error</Button>
            </div>
            
            <div className="min-h-[200px] border rounded-md p-4">
              <ApiErrorBoundary
                resetKeys={[errorType]}
                maxRetries={3}
                retryDelay={1000}
                onError={(error) => console.log('API Error caught by boundary:', error)}
              >
                <ErrorThrower errorType={errorType} />
              </ApiErrorBoundary>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="justify-end">
        <Button variant="outline" onClick={resetError}>
          Reset Demo
        </Button>
      </CardFooter>
    </Card>
  );
};