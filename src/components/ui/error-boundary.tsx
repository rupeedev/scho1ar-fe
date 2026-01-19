import React from 'react';
import { 
  ErrorType, 
  formatErrorMessage, 
  getSuggestedAction, 
  createErrorInfo 
} from '@/lib/error-handling';
import { Button } from './button';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: any[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors in its child component tree.
 * Provides a fallback UI when an error occurs.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
  };

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset the error boundary when any of the resetKeys change
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      Array.isArray(this.props.resetKeys) &&
      Array.isArray(prevProps.resetKeys) &&
      this.props.resetKeys.length === prevProps.resetKeys.length &&
      this.props.resetKeys.some((value, index) => value !== prevProps.resetKeys?.[index])
    ) {
      this.resetErrorBoundary();
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      const errorInfo = createErrorInfo(this.state.error);
      const errorMessage = formatErrorMessage(this.state.error);
      const suggestedAction = getSuggestedAction(this.state.error);

      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="p-4 space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
            <Button onClick={this.resetErrorBoundary}>
              {suggestedAction}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version for function components to access the error boundary reset functionality
 */
export const useErrorBoundaryReset = (callback: () => void): (() => void) => {
  return callback;
};