import { authTokenManager } from '@/lib/auth-token';
import {
  ErrorType,
  createErrorInfo,
  calculateRetryDelay
} from '@/lib/error-handling';
import { errorLogger } from '@/lib/error-logging';

// Load API URL from env variable or use production backend
const API_URL = import.meta.env.VITE_API_URL || 'https://costpie-backend.onrender.com';


// Request options with retry configuration
interface ApiRequestOptions extends RequestInit {
  retry?: {
    maxRetries?: number;
    retryDelay?: number;
    retryStatuses?: number[];
  };
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // Base delay in ms
  retryStatuses: [408, 429, 500, 502, 503, 504]
};

// Helper function to get JWT token from Clerk auth
async function getAuthToken(): Promise<string | null> {
  try {
    return await authTokenManager.getToken();
  } catch (error) {
    console.error('Error getting auth token:', error);
    errorLogger.logError(error, { context: 'getAuthToken' });
    return null;
  }
}

// Handle errors from the API response
function handleApiError(response: Response, data: any): never {
  // Create a structured error object
  const errorObj: any = new Error(
    Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || `API request failed with status ${response.status}`
  );

  // Attach status and other API error properties
  errorObj.status = response.status;
  errorObj.statusText = response.statusText;
  errorObj.url = response.url;

  if (data.error) {
    errorObj.apiError = data.error;
  }

  if (data.errors) {
    errorObj.validationErrors = data.errors;
  }

  // Special cases for certain error types
  if (response.status === 401) {
    errorObj.authError = true;
  }

  throw errorObj;
}

// Create a base fetch function with authentication and retry logic
async function apiFetch<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  // Extract and merge retry configuration with defaults
  const {
    retry: retryConfig = {},
    ...fetchOptions
  } = options;

  const retry = {
    ...DEFAULT_RETRY_CONFIG,
    ...retryConfig
  };

  const url = `${API_URL}${endpoint}`;
  let attempt = 0;

  // Start retry loop
  while (true) {
    try {
      const token = await getAuthToken();
      const organizationId = localStorage.getItem('organizationId');

      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(organizationId && { 'x-organization-id': organizationId }),
        ...fetchOptions.headers,
      };

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Handle different response content types
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        const data = await response.json();

        if (!response.ok) {
          handleApiError(response, data);
        }

        return data as T;
      } else {
        // Handle non-JSON responses like file downloads
        if (!response.ok) {
          const error: any = new Error(`API request failed with status ${response.status}`);
          error.status = response.status;
          error.statusText = response.statusText;
          error.url = response.url;
          throw error;
        }

        return await response.text() as unknown as T;
      }
    } catch (error) {
      // Track the attempt
      attempt++;

      // Log the error
      const errorContext = {
        url,
        method: fetchOptions.method || 'GET',
        attempt,
        endpoint
      };

      errorLogger.logError(error, errorContext);

      // Check if we should retry
      const errorInfo = createErrorInfo(error);
      const shouldRetry =
        attempt < retry.maxRetries &&
        errorInfo.retryable &&
        (
          // Either it's a network error
          errorInfo.type === ErrorType.NETWORK ||
          errorInfo.type === ErrorType.TIMEOUT ||
          // Or it's an API error with a status code we want to retry
          (errorInfo.statusCode && retry.retryStatuses.includes(errorInfo.statusCode))
        );

      if (shouldRetry) {
        // Calculate delay with exponential backoff
        const delay = calculateRetryDelay(attempt - 1, retry.retryDelay);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        continue; // Retry the request
      }

      // If we shouldn't retry, or we've exhausted retries, rethrow the error
      throw error;
    }
  }
}

// Export convenience methods for different HTTP methods
export const apiClient = {
  get: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
