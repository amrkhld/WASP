interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export class SocketRateLimit {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  checkLimit(socketId: string): { allowed: boolean; resetTime: number } {
    const now = Date.now();
    const record = this.store[socketId];

    if (!record) {
      this.store[socketId] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      return { allowed: true, resetTime: this.store[socketId].resetTime };
    }

    if (now > record.resetTime) {
      this.store[socketId] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      return { allowed: true, resetTime: this.store[socketId].resetTime };
    }

    if (record.count >= this.config.maxRequests) {
      return { allowed: false, resetTime: record.resetTime };
    }

    record.count += 1;
    return { allowed: true, resetTime: record.resetTime };
  }

  getRemainingRequests(socketId: string): number {
    const now = Date.now();
    const record = this.store[socketId];

    if (!record || now > record.resetTime) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - record.count);
  }

  getTimeToReset(socketId: string): number {
    const now = Date.now();
    const record = this.store[socketId];

    if (!record || now > record.resetTime) {
      return 0;
    }

    return Math.max(0, record.resetTime - now);
  }

  cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(socketId => {
      if (now > this.store[socketId].resetTime) {
        delete this.store[socketId];
      }
    });
  }

  // Run cleanup periodically
  startCleanup(interval: number = 60000): NodeJS.Timeout {
    return setInterval(() => this.cleanup(), interval);
  }
}

// Create a singleton instance for the application
export const socketRateLimiter = new SocketRateLimit({
  maxRequests: 60, // 60 messages
  windowMs: 60000  // per minute
});