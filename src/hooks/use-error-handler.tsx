import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { 
  formatErrorMessage,
  getSuggestedAction,
  createErrorInfo,
  ErrorType,
  ErrorInfo 
} from '@/lib/error-handling';
import { errorLogger } from '@/lib/error-logging';
import { useNavigate } from 'react-router-dom';

interface ErrorHandlerOptions {
  showToast?: boolean;
  redirectOnAuth?: boolean;
  context?: Record<string, any>;
  onError?: (error: unknown, errorInfo: ErrorInfo) => void;
}

/**
 * Hook that provides standardized error handling
 * @param options Configuration options for error handling behavior
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { 
    showToast = true, 
    redirectOnAuth = true,
    context = {},
    onError
  } = options;
  
  const navigate = useNavigate();
  const [error, setError] = useState<Error | null>(null);
  
  // Handle errors with standardized approach
  const handleError = useCallback((err: unknown) => {
    // Create structured error info
    const errorInfo = createErrorInfo(err, context);
    
    // Set error state
    if (err instanceof Error) {
      setError(err);
    } else {
      setError(new Error(errorInfo.message));
    }
    
    // Log the error
    errorLogger.logError(err, context);
    
    // Call custom error handler if provided
    if (onError) {
      onError(err, errorInfo);
    }
    
    // Handle authentication errors with redirect if enabled
    if (redirectOnAuth && 
       (errorInfo.type === ErrorType.AUTHENTICATION || 
        errorInfo.type === ErrorType.SESSION_EXPIRED)) {
      // Show toast before redirect
      if (showToast) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to continue.",
          variant: "destructive"
        });
      }
      
      // Redirect to login page
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
      
      return;
    }
    
    // Show toast notification if enabled
    if (showToast) {
      const action = getSuggestedAction(err);
      
      toast({
        title: errorInfo.type.charAt(0) + errorInfo.type.slice(1).toLowerCase().replace(/_/g, ' '),
        description: formatErrorMessage(err),
        variant: "destructive",
        action: action !== 'Try again' ? {
          label: action,
          onClick: () => {
            if (action === 'Sign in again') {
              navigate('/login');
            } else if (action === 'Reload page') {
              window.location.reload();
            }
          }
        } : undefined
      });
    }
  }, [showToast, redirectOnAuth, context, onError, navigate]);
  
  // Reset error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    error,
    handleError,
    clearError,
    isError: error !== null
  };
}

export default useErrorHandler;