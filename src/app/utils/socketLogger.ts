interface LogEntry {
  event: string;
  socketId: string;
  timestamp: string;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

class SocketLogger {
  private static instance: SocketLogger;
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;

  private constructor() {}

  static getInstance(): SocketLogger {
    if (!SocketLogger.instance) {
      SocketLogger.instance = new SocketLogger();
    }
    return SocketLogger.instance;
  }

  log(entry: Omit<LogEntry, 'timestamp'>) {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // In development, also log to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Socket ${entry.socketId}] ${entry.event}:`, {
        ...entry,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  }

  getLogs(limit = 100, filter?: { socketId?: string; event?: string }): LogEntry[] {
    let filtered = this.logs;
    
    if (filter?.socketId) {
      filtered = filtered.filter(log => log.socketId === filter.socketId);
    }
    
    if (filter?.event) {
      filtered = filtered.filter(log => log.event === filter.event);
    }
    
    return filtered.slice(0, limit);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const socketLogger = SocketLogger.getInstance();