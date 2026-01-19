/**
 * Error logging service for Scho1ar Solution application
 * Centralizes error logging and reporting
 */

import { ErrorInfo, ErrorType, createErrorInfo } from './error-handling';

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Configuration for error logging
interface ErrorLoggerConfig {
  consoleEnabled: boolean;
  remoteEnabled: boolean;
  sampleRate: number; // 0-1, percentage of errors to log remotely
  applicationVersion?: string;
  environment?: 'development' | 'staging' | 'production';
}

// Default configuration
const defaultConfig: ErrorLoggerConfig = {
  consoleEnabled: true,
  remoteEnabled: isProduction, // Only enable remote logging in production by default
  sampleRate: isProduction ? 0.1 : 1.0, // Sample 10% of errors in production, all in development
  environment: isDevelopment ? 'development' : 'production'
};

// Enhanced data for error logging
interface ErrorLogData extends ErrorInfo {
  userAgent?: string;
  url?: string;
  path?: string;
  clientTimestamp: Date;
  userId?: string;
  sessionId?: string;
  applicationVersion?: string;
  componentStack?: string;
  environment?: string;
  tags?: string[];
}

/**
 * Error Logger Class
 * Handles formatting, enrichment, and sending of error logs
 */
class ErrorLogger {
  private config: ErrorLoggerConfig;
  private sessionId: string;
  private userId?: string;
  
  constructor(config: Partial<ErrorLoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.sessionId = this.generateSessionId();
  }
  
  /**
   * Generate a random session ID for error tracking
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * Set user ID for error tracking
   */
  setUserId(userId: string | undefined) {
    this.userId = userId;
  }
  
  /**
   * Enrich error with additional data
   */
  private enrichErrorData(errorInfo: ErrorInfo): ErrorLogData {
    return {
      ...errorInfo,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      clientTimestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      applicationVersion: this.config.applicationVersion,
      environment: this.config.environment
    };
  }
  
  /**
   * Log error to console
   */
  private logToConsole(errorLogData: ErrorLogData): void {
    if (!this.config.consoleEnabled) return;
    
    // Color-coded console output for different error types
    const styles = {
      [ErrorType.AUTHENTICATION]: 'background: #AA0000; color: white; padding: 2px 4px; border-radius: 2px;',
      [ErrorType.AUTHORIZATION]: 'background: #AA0000; color: white; padding: 2px 4px; border-radius: 2px;',
      [ErrorType.SESSION_EXPIRED]: 'background: #AA0000; color: white; padding: 2px 4px; border-radius: 2px;',
      [ErrorType.NETWORK]: 'background: #CC6600; color: white; padding: 2px 4px; border-radius: 2px;',
      [ErrorType.TIMEOUT]: 'background: #CC6600; color: white; padding: 2px 4px; border-radius: 2px;',
      [ErrorType.API_ERROR]: 'background: #CC6600; color: white; padding: 2px 4px; border-radius: 2px;',
      [ErrorType.VALIDATION_ERROR]: 'background: #666699; color: white; padding: 2px 4px; border-radius: 2px;',
      [ErrorType.RATE_LIMIT]: 'background: #CC6600; color: white; padding: 2px 4px; border-radius: 2px;',
      [ErrorType.SERVER_ERROR]: 'background: #CC0000; color: white; padding: 2px 4px; border-radius: 2px;',
      default: 'background: #666666; color: white; padding: 2px 4px; border-radius: 2px;',
    };
    
    const errorStyle = styles[errorLogData.type] || styles.default;
    
    console.group(`%c${errorLogData.type}`, errorStyle);
    console.error(errorLogData.message);
    console.info('Error Details:', errorLogData);
    if (errorLogData.originalError) {
      console.error('Original Error:', errorLogData.originalError);
    }
    console.groupEnd();
  }
  
  /**
   * Log error to remote service (e.g., Sentry, LogRocket, etc.)
   */
  private async logToRemoteService(errorLogData: ErrorLogData): Promise<void> {
    if (!this.config.remoteEnabled) return;
    
    // Apply sampling - only log a percentage of errors to reduce volume
    if (Math.random() > this.config.sampleRate) return;
    
    try {
      // Example implementation for remote logging service
      // This should be replaced with actual service integration
      // e.g., Sentry, LogRocket, Application Insights, etc.
      if (typeof window !== 'undefined') {
        const payload = {
          ...errorLogData,
          clientTimestamp: errorLogData.clientTimestamp.toISOString()
        };
        
        // For now, just mock the API call in console
        console.info('📤 Would send to error logging service:', payload);
        
        // Example implementation when ready:
        // const response = await fetch('/api/error-logs', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(payload)
        // });
        
        // if (!response.ok) {
        //   console.error('Failed to log error remotely:', await response.text());
        // }
      }
    } catch (loggingError) {
      // Don't let logging errors cause more problems
      if (this.config.consoleEnabled) {
        console.error('Error logging failed:', loggingError);
      }
    }
  }
  
  /**
   * Main logging method - log any error
   */
  async logError(error: unknown, context?: Record<string, any>, componentStack?: string): Promise<void> {
    const errorInfo = createErrorInfo(error, context);
    const enrichedError = this.enrichErrorData(errorInfo);
    
    if (componentStack) {
      enrichedError.componentStack = componentStack;
    }
    
    // Log to console
    this.logToConsole(enrichedError);
    
    // Log to remote service
    await this.logToRemoteService(enrichedError);
    
    return Promise.resolve();
  }
  
  /**
   * Log React error boundary errors
   */
  logErrorBoundary(error: Error, errorInfo: React.ErrorInfo, context?: Record<string, any>): void {
    this.logError(error, context, errorInfo.componentStack);
  }
}

// Export singleton instance with default config
export const errorLogger = new ErrorLogger();

// Also export the class for custom instances
export { ErrorLogger };