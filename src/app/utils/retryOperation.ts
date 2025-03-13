import { logger } from './logger';

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: Error) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  shouldRetry: () => true
};

export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: Error | null = null;
  let delay = opts.initialDelay;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === opts.maxAttempts || !opts.shouldRetry(lastError)) {
        logger.error('Retry operation failed', {
          error: lastError.message,
          attempt,
          maxAttempts: opts.maxAttempts
        });
        throw lastError;
      }

      logger.info('Retrying operation', {
        attempt,
        nextDelay: delay,
        error: lastError.message
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
    }
  }

  // This should never be reached due to the throw in the loop
  throw lastError || new Error('Retry operation failed');
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors or timeout errors are retryable
    if (
      error.name === 'NetworkError' ||
      error.name === 'TimeoutError' ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('failed to fetch')
    ) {
      return true;
    }

    // Rate limiting errors should be retried
    if (
      error.message.includes('429') ||
      error.message.includes('too many requests')
    ) {
      return true;
    }
  }

  return false;
}