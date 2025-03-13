import { logger } from './logger';

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  url?: string;
  userAgent?: string;
}

export class ErrorReporting {
  private static instance: ErrorReporting;
  
  private constructor() {}

  static getInstance(): ErrorReporting {
    if (!ErrorReporting.instance) {
      ErrorReporting.instance = new ErrorReporting();
    }
    return ErrorReporting.instance;
  }

  captureError(error: Error, componentStack?: string): void {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
    };

    // Log the error locally
    logger.error('Application error', errorReport);

    // In production, you could send this to your error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(errorReport);
    }
  }

  private async sendToErrorService(report: ErrorReport): Promise<void> {
    try {
      // You can implement your own error reporting service integration here
      // For example, sending to Sentry, LogRocket, or your own error tracking endpoint
      const response = await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });

      if (!response.ok) {
        logger.warn('Failed to send error report', {
          status: response.status,
          error: await response.text()
        });
      }
    } catch (error) {
      // Don't throw here - we don't want errors in error reporting
      logger.warn('Error while sending error report', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}