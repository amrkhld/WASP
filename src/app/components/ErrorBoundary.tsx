import React from 'react';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.reportError(error, errorInfo);
  }

  private async reportError(error: Error, errorInfo: React.ErrorInfo): Promise<void> {
    try {
      const errorReport = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        retryCount: this.state.retryCount
      };

      logger.error('React error boundary caught error', errorReport);

      await fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  private handleRetry = async (): Promise<void> => {
    if (this.state.retryCount >= MAX_RETRIES) {
      logger.warn('Maximum retry attempts reached', {
        error: this.state.error?.message,
        retryCount: this.state.retryCount
      });
      return;
    }

    this.setState(state => ({ retryCount: state.retryCount + 1 }));

    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));

    this.setState({ hasError: false });
  };

  private handleReset = (): void => {
    window.location.href = '/';
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>Something went wrong</h2>
            <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
            {this.state.retryCount < MAX_RETRIES ? (
              <button 
                onClick={this.handleRetry}
                className="retry-button"
              >
                Retry ({MAX_RETRIES - this.state.retryCount} attempts remaining)
              </button>
            ) : (
              <button 
                onClick={this.handleReset}
                className="reset-button"
              >
                Return to Home
              </button>
            )}
            <p className="error-details">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}