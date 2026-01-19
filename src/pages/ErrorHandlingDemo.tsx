import React from 'react';
import ErrorBoundaryDemo from '@/components/examples/ErrorHandlingDemo';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { errorLogger } from '@/lib/error-logging';

const ErrorHandlingDemoPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Error Handling System Demo</h1>
      
      <div className="space-y-8">
        <ErrorBoundary
          onError={(error, errorInfo) => {
            errorLogger.logErrorBoundary(error, errorInfo, { source: 'error-demo-page' });
          }}
        >
          <ErrorBoundaryDemo />
        </ErrorBoundary>
        
        <div className="p-6 bg-gray-50 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">About the Error Handling System</h2>
          <p className="mb-4">
            This demo page showcases the comprehensive error handling system implemented in CostPie:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li>
              <strong>Error Boundaries:</strong> React components that catch JavaScript errors and display fallback UIs
            </li>
            <li>
              <strong>Error Classification:</strong> Standardized categorization of errors (network, authentication, validation, etc.)
            </li>
            <li>
              <strong>API Client with Retry:</strong> Automatic retry for transient errors with exponential backoff
            </li>
            <li>
              <strong>React Query Integration:</strong> Query error handling with proper retry and error reporting
            </li>
            <li>
              <strong>Error Logging:</strong> Centralized error logging with contextual information
            </li>
            <li>
              <strong>User-Friendly Messaging:</strong> Clear error messages with suggested actions
            </li>
          </ul>
          <p>
            The system works together to provide a robust error handling experience, 
            reducing disruptions for users while giving developers the information 
            they need to diagnose and fix issues.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorHandlingDemoPage;