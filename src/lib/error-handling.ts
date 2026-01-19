/**
 * Comprehensive error handling utilities for CostPie application
 */

// Define specific error types for better handling
export enum ErrorType {
  // Auth related errors
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Network errors
  NETWORK = 'NETWORK', 
  TIMEOUT = 'TIMEOUT',
  
  // API errors
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  
  // Cloud provider errors
  AWS_ERROR = 'AWS_ERROR',
  CLOUD_ACCESS_DENIED = 'CLOUD_ACCESS_DENIED',
  RESOURCE_ERROR = 'RESOURCE_ERROR',
  
  // General errors
  UNKNOWN = 'UNKNOWN',
  SERVER_ERROR = 'SERVER_ERROR'
}

// Interface for structured error information
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  statusCode?: number;
  timestamp: Date;
  context?: Record<string, any>;
  originalError?: Error;
  retryable: boolean;
}

/**
 * Create a standardized error object from various error sources
 */
export function createErrorInfo(error: unknown, context?: Record<string, any>): ErrorInfo {
  const timestamp = new Date();
  
  // Default error info
  const defaultErrorInfo: ErrorInfo = {
    type: ErrorType.UNKNOWN,
    message: 'An unknown error occurred',
    timestamp,
    retryable: true,
    context
  };
  
  // Handle case when error is already an ErrorInfo object
  if (typeof error === 'object' && error !== null && 'type' in error && 'message' in error) {
    return {
      ...(error as ErrorInfo),
      timestamp,
      context: { ...(error as ErrorInfo).context, ...context }
    };
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    const errorInfo: ErrorInfo = {
      ...defaultErrorInfo,
      message: error.message,
      originalError: error
    };
    
    // Detect network errors
    if (error.name === 'TypeError' && error.message.includes('network')) {
      errorInfo.type = ErrorType.NETWORK;
      errorInfo.message = 'Network error: Please check your connection';
      errorInfo.retryable = true;
    }
    
    // Handle timeout errors
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      errorInfo.type = ErrorType.TIMEOUT;
      errorInfo.message = 'Request timed out';
      errorInfo.retryable = true;
    }
    
    return errorInfo;
  }
  
  // Handle HTTP response errors
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const statusCode = (error as any).status;
    let errorType = ErrorType.API_ERROR;
    let retryable = true;
    
    // Classify based on status code
    if (statusCode === 401) {
      errorType = ErrorType.AUTHENTICATION;
      retryable = false;
    } else if (statusCode === 403) {
      errorType = ErrorType.AUTHORIZATION;
      retryable = false;
    } else if (statusCode === 404) {
      errorType = ErrorType.NOT_FOUND;
      retryable = false;
    } else if (statusCode === 422) {
      errorType = ErrorType.VALIDATION_ERROR;
      retryable = false;
    } else if (statusCode === 429) {
      errorType = ErrorType.RATE_LIMIT;
      retryable = true;
    } else if (statusCode >= 500) {
      errorType = ErrorType.SERVER_ERROR;
      retryable = true;
    }
    
    return {
      ...defaultErrorInfo,
      type: errorType,
      message: (error as any).message || `Server responded with status ${statusCode}`,
      statusCode,
      retryable
    };
  }
  
  // Handle AWS specific errors
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const awsErrorCode = (error as any).code;
    
    if (typeof awsErrorCode === 'string' && awsErrorCode.startsWith('AWS')) {
      return {
        ...defaultErrorInfo,
        type: ErrorType.AWS_ERROR,
        message: (error as any).message || `AWS Error: ${awsErrorCode}`,
        context: { ...(context || {}), awsErrorCode }
      };
    }
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return {
      ...defaultErrorInfo,
      message: error
    };
  }
  
  return defaultErrorInfo;
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const errorInfo = createErrorInfo(error);
  return errorInfo.retryable;
}

/**
 * Format error message for user-friendly display
 */
export function formatErrorMessage(error: unknown): string {
  const errorInfo = createErrorInfo(error);
  
  // Custom user-friendly messages based on error type
  switch (errorInfo.type) {
    case ErrorType.AUTHENTICATION:
      return 'Authentication error: Please sign in again';
    case ErrorType.AUTHORIZATION:
      return 'You do not have permission to perform this action';
    case ErrorType.SESSION_EXPIRED:
      return 'Your session has expired, please sign in again';
    case ErrorType.NETWORK:
      return 'Network error: Please check your connection and try again';
    case ErrorType.TIMEOUT:
      return 'The request timed out. Please try again';
    case ErrorType.VALIDATION_ERROR:
      return 'There was an issue with the data you provided';
    case ErrorType.NOT_FOUND:
      return 'The requested resource was not found';
    case ErrorType.RATE_LIMIT:
      return 'Too many requests. Please try again later';
    case ErrorType.AWS_ERROR:
      return 'There was an issue with the AWS service';
    case ErrorType.CLOUD_ACCESS_DENIED:
      return 'Access to cloud resources was denied. Please check your credentials';
    case ErrorType.RESOURCE_ERROR:
      return 'There was an issue with the cloud resource';
    case ErrorType.SERVER_ERROR:
      return 'Server error: We\'re working to fix this issue';
    default:
      return errorInfo.message;
  }
}

/**
 * Get suggested action based on error type
 */
export function getSuggestedAction(error: unknown): string {
  const errorInfo = createErrorInfo(error);
  
  switch (errorInfo.type) {
    case ErrorType.AUTHENTICATION:
    case ErrorType.SESSION_EXPIRED:
      return 'Sign in again';
    case ErrorType.NETWORK:
      return 'Check your internet connection';
    case ErrorType.TIMEOUT:
    case ErrorType.SERVER_ERROR:
    case ErrorType.UNKNOWN:
      return 'Try again later';
    case ErrorType.RATE_LIMIT:
      return 'Wait a few minutes and try again';
    case ErrorType.CLOUD_ACCESS_DENIED:
      return 'Verify your cloud credentials';
    default:
      return 'Try again';
  }
}

/**
 * Exponential backoff calculation for retries
 */
export function calculateRetryDelay(attempt: number, baseDelay = 1000): number {
  // Exponential backoff with jitter to avoid thundering herd
  const expBackoff = Math.min(baseDelay * Math.pow(2, attempt), 30000); // Cap at 30 seconds
  const jitter = 0.5 * expBackoff * Math.random(); // Add randomness
  return expBackoff + jitter;
}