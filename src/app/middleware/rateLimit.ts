import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../utils/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_SIZE = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // requests per window

export function rateLimit(req: NextRequest) {
  const ip = req.ip || 'anonymous';
  const now = Date.now();

  // Clean up old entries
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }

  // Initialize or get existing window
  if (!store[ip] || store[ip].resetTime < now) {
    store[ip] = {
      count: 0,
      resetTime: now + WINDOW_SIZE
    };
  }

  // Increment request count
  store[ip].count++;

  // Set rate limit headers
  const remainingRequests = Math.max(0, MAX_REQUESTS - store[ip].count);
  const headers = new Headers({
    'X-RateLimit-Limit': MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': remainingRequests.toString(),
    'X-RateLimit-Reset': store[ip].resetTime.toString(),
  });

  // Check if rate limit exceeded
  if (store[ip].count > MAX_REQUESTS) {
    logger.warn('Rate limit exceeded', {
      ip,
      endpoint: req.nextUrl.pathname,
      requestCount: store[ip].count
    });

    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfter: Math.ceil((store[ip].resetTime - now) / 1000)
      },
      {
        status: 429,
        headers: {
          ...Object.fromEntries(headers.entries()),
          'Retry-After': Math.ceil((store[ip].resetTime - now) / 1000).toString()
        }
      }
    );
  }

  return NextResponse.next({
    headers
  });
}