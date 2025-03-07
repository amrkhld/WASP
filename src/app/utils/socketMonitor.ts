interface SocketMetrics {
  latency: number[];
  messagesSent: number;
  messagesReceived: number;
  errors: { timestamp: number; error: string }[];
  connectionDuration: number;
  reconnections: number;
  lastPing?: number;
}

class SocketMonitor {
  private static instance: SocketMonitor;
  private metrics: Map<string, SocketMetrics> = new Map();
  private startTimes: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): SocketMonitor {
    if (!SocketMonitor.instance) {
      SocketMonitor.instance = new SocketMonitor();
    }
    return SocketMonitor.instance;
  }

  initializeSocket(socketId: string): void {
    this.metrics.set(socketId, {
      latency: [],
      messagesSent: 0,
      messagesReceived: 0,
      errors: [],
      connectionDuration: 0,
      reconnections: 0
    });
    this.startTimes.set(socketId, Date.now());
  }

  recordLatency(socketId: string, latency: number): void {
    const metrics = this.metrics.get(socketId);
    if (metrics) {
      metrics.latency.push(latency);
      // Keep only last 100 measurements
      if (metrics.latency.length > 100) {
        metrics.latency.shift();
      }
    }
  }

  recordMessageSent(socketId: string): void {
    const metrics = this.metrics.get(socketId);
    if (metrics) {
      metrics.messagesSent++;
    }
  }

  recordMessageReceived(socketId: string): void {
    const metrics = this.metrics.get(socketId);
    if (metrics) {
      metrics.messagesReceived++;
    }
  }

  recordError(socketId: string, error: string): void {
    const metrics = this.metrics.get(socketId);
    if (metrics) {
      metrics.errors.push({ timestamp: Date.now(), error });
      // Keep only last 50 errors
      if (metrics.errors.length > 50) {
        metrics.errors.shift();
      }
    }
  }

  recordReconnection(socketId: string): void {
    const metrics = this.metrics.get(socketId);
    if (metrics) {
      metrics.reconnections++;
    }
  }

  updateConnectionDuration(socketId: string): void {
    const metrics = this.metrics.get(socketId);
    const startTime = this.startTimes.get(socketId);
    if (metrics && startTime) {
      metrics.connectionDuration = Date.now() - startTime;
    }
  }

  recordPing(socketId: string): void {
    const metrics = this.metrics.get(socketId);
    if (metrics) {
      metrics.lastPing = Date.now();
    }
  }

  getMetrics(socketId: string): SocketMetrics | undefined {
    return this.metrics.get(socketId);
  }

  getAverageLatency(socketId: string): number {
    const metrics = this.metrics.get(socketId);
    if (!metrics || metrics.latency.length === 0) return 0;
    const sum = metrics.latency.reduce((a, b) => a + b, 0);
    return sum / metrics.latency.length;
  }

  clearMetrics(socketId: string): void {
    this.metrics.delete(socketId);
    this.startTimes.delete(socketId);
  }
}

export const socketMonitor = SocketMonitor.getInstance();