interface LogMessage {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private isProd = process.env.NODE_ENV === 'production';
  private errorLogs: LogMessage[] = [];
  private readonly maxStoredErrors = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(logMessage: LogMessage): string {
    const contextStr = logMessage.context ? ` | ${JSON.stringify(logMessage.context)}` : '';
    return `[${logMessage.timestamp}] ${logMessage.level.toUpperCase()}: ${logMessage.message}${contextStr}`;
  }

  private log(level: LogMessage['level'], message: string, context?: Record<string, any>) {
    const logMessage: LogMessage = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context
    };

    const formattedMessage = this.formatMessage(logMessage);

    if (level === 'error') {
      this.storeError(logMessage);
    }

    if (this.isProd) {
      // In production, send logs to logging service if configured
      console[level](formattedMessage);
      this.sendToLoggingService(logMessage);
    } else {
      // In development, pretty print with colors
      const colors = {
        info: '\x1b[36m', // cyan
        warn: '\x1b[33m', // yellow
        error: '\x1b[31m', // red
        debug: '\x1b[35m', // magenta
        reset: '\x1b[0m'
      };
      console[level](`${colors[level]}${formattedMessage}${colors.reset}`);
    }
  }

  private storeError(logMessage: LogMessage) {
    this.errorLogs.unshift(logMessage);
    if (this.errorLogs.length > this.maxStoredErrors) {
      this.errorLogs.pop();
    }
  }

  private async sendToLoggingService(logMessage: LogMessage) {
    if (!this.isProd) return;

    try {
      const loggingEndpoint = process.env.LOGGING_SERVICE_URL;
      if (!loggingEndpoint) return;

      await fetch(loggingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logMessage),
      });
    } catch (error) {
      // Don't use logger here to avoid infinite loop
      console.error('Failed to send log to logging service:', error);
    }
  }

  async getRecentErrors(since?: Date): Promise<LogMessage[]> {
    if (since) {
      return this.errorLogs.filter(log => 
        new Date(log.timestamp) > since
      );
    }
    return this.errorLogs;
  }

  getErrorRate(timeWindowMs: number = 300000): number {
    const now = Date.now();
    const windowStart = now - timeWindowMs;
    const errorsInWindow = this.errorLogs.filter(log =>
      new Date(log.timestamp).getTime() > windowStart
    );
    return errorsInWindow.length / (timeWindowMs / 1000); // errors per second
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }

  debug(message: string, context?: Record<string, any>) {
    if (!this.isProd) {
      this.log('debug', message, context);
    }
  }

  clearErrors() {
    this.errorLogs = [];
  }
}

export const logger = Logger.getInstance();