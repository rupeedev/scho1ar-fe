import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './index.css'
import { ClerkAuthProvider } from './hooks/use-clerk-auth.tsx'
import { ThemeProvider } from './hooks/use-theme.tsx'
import { ErrorBoundary } from './components/ui/error-boundary.tsx'
import { errorLogger } from './lib/error-logging.ts'
import { isRetryableError, calculateRetryDelay } from './lib/error-handling.ts'

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable')
}

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
    },
    mutations: {
      retry: false, // Generally don't retry mutations automatically
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
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="light" storageKey="costpie-ui-theme">
              <ClerkAuthProvider>
                <App />
              </ClerkAuthProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ClerkProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
