import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// ReactQueryDevtools removed - no longer needed
import App from './App.tsx'
import './index.css'
import { SupabaseAuthProvider } from './hooks/use-supabase-auth.tsx'
import { ThemeProvider } from './hooks/use-theme.tsx'
import { ErrorBoundary } from './components/ui/error-boundary.tsx'
import { errorLogger } from './lib/error-logging.ts'
import { isRetryableError, calculateRetryDelay } from './lib/error-handling.ts'

// Create a client with enhanced error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes by default
      retry: (failureCount, error) => {
        // Use our error utility to determine if error is retryable
        const shouldRetry = isRetryableError(error);
        // Only retry up to 3 times and only if the error is retryable
        return shouldRetry && failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        // Use our exponential backoff calculation for retries
        return calculateRetryDelay(attemptIndex);
      },
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      onError: (error) => {
        // Log all query errors through our error logging system
        errorLogger.logError(error, { source: 'react-query' });
      }
    },
    mutations: {
      retry: false, // Generally don't retry mutations automatically
      onError: (error, variables, context) => {
        // Log mutation errors with context about the operation
        errorLogger.logError(error, { 
          source: 'react-query-mutation',
          variables,
          context
        });
      }
    }
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary
      onError={(error, errorInfo) => {
        errorLogger.logErrorBoundary(error, errorInfo, { source: 'root-error-boundary' });
      }}
    >
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light" storageKey="costpie-ui-theme">
            <SupabaseAuthProvider>
              <App />
            </SupabaseAuthProvider>
          </ThemeProvider>
          {/* React Query Devtools removed */}
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)