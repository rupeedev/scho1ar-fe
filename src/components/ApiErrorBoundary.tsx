import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './ui/error-boundary';
import { 
  ErrorType, 
  formatErrorMessage, 
  getSuggestedAction, 
  calculateRetryDelay,
  createErrorInfo,
  isRetryableError
} from '@/lib/error-handling';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Loader2, AlertCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  retryDelay?: number;
  resetKeys?: any[];
}

/**
 * Custom fallback component with retry mechanism for API errors
 */
const ApiErrorFallback = ({ 
  error, 
  resetErrorBoundary, 
  maxRetries = 3,
  retryDelay = 1000
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
  maxRetries?: number;
  retryDelay?: number;
}) => {
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const errorInfo = createErrorInfo(error);
  const errorMessage = formatErrorMessage(error);
  const suggestedAction = getSuggestedAction(error);
  const canRetry = isRetryableError(error) && retryCount < maxRetries;

  // Handle automatic retry with exponential backoff
  const handleRetry = () => {
    if (retryCount >= maxRetries) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    const delay = calculateRetryDelay(retryCount, retryDelay);
    setRemainingTime(Math.floor(delay / 1000));
    
    const intervalId = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimeout(() => {
      setIsRetrying(false);
      resetErrorBoundary();
      clearInterval(intervalId);
    }, delay);
  };

  // If it's an authentication error, navigate to login
  useEffect(() => {
    if (errorInfo.type === ErrorType.AUTHENTICATION || 
        errorInfo.type === ErrorType.SESSION_EXPIRED) {
      const redirectTimer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [errorInfo.type, navigate]);

  // Show different UI based on error type
  let Icon = AlertCircle;
  let title = "Error";
  let variant: "default" | "destructive" | null = "destructive";
  
  switch (errorInfo.type) {
    case ErrorType.AUTHENTICATION:
    case ErrorType.SESSION_EXPIRED:
      Icon = ShieldAlert;
      title = "Authentication Error";
      break;
    case ErrorType.AUTHORIZATION:
      Icon = ShieldAlert;
      title = "Authorization Error";
      break;
    case ErrorType.NETWORK:
    case ErrorType.TIMEOUT:
      Icon = AlertTriangle;
      title = "Connection Error";
      variant = "default";
      break;
    case ErrorType.RATE_LIMIT:
      Icon = AlertTriangle;
      title = "Rate Limit Exceeded";
      variant = "default";
      break;
  }

  return (
    <div className="p-4 space-y-4">
      <Alert variant={variant}>
        <Icon className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
      
      {/* Show retry counter if already attempted retries */}
      {retryCount > 0 && (
        <div className="text-sm text-gray-500">
          Retry attempt {retryCount} of {maxRetries}
        </div>
      )}
      
      {/* Show retry countdown if in progress */}
      {isRetrying && remainingTime > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Retrying in {remainingTime} second{remainingTime !== 1 ? 's' : ''}...
        </div>
      )}
      
      <div className="flex justify-end space-x-2">
        {/* Conditional rendering based on error type */}
        {(errorInfo.type === ErrorType.AUTHENTICATION || 
          errorInfo.type === ErrorType.SESSION_EXPIRED) && (
          <Button onClick={() => navigate('/login')}>
            Sign In
          </Button>
        )}
        
        {canRetry && !isRetrying && (
          <Button onClick={handleRetry}>
            Retry
          </Button>
        )}
        
        {(!canRetry || retryCount >= maxRetries) && !isRetrying && (
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * ApiErrorBoundary component that extends the base ErrorBoundary
 * with specialized handling for API errors including retry mechanisms
 */
export const ApiErrorBoundary: React.FC<ApiErrorBoundaryProps> = ({
  children,
  onError,
  maxRetries = 3,
  retryDelay = 1000,
  resetKeys,
}) => {
  return (
    <ErrorBoundary
      onError={onError}
      resetKeys={resetKeys}
      fallback={({ error, resetErrorBoundary }: any) => (
        <ApiErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          maxRetries={maxRetries}
          retryDelay={retryDelay}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};