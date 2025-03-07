import { createServer } from 'http';
import { Server } from 'socket.io';
import { NextRequest } from 'next/server';
import { NextApiResponseServerIO } from '@/app/types/socket';
import { socketMonitor } from '@/app/utils/socketMonitor';
import { socketLogger } from '@/app/utils/socketLogger';

const httpServer = createServer();
const io = new Server(httpServer, {
  path: '/api/socket',
  addTrailingSlash: false,
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowEIO3: true,
  maxHttpBufferSize: 1e8 // 100 MB
});

// Error handling middleware
io.use((socket, next) => {
  const { token } = socket.handshake.auth;
  socketMonitor.initializeSocket(socket.id);
  socketLogger.log({
    event: 'connection_attempt',
    socketId: socket.id,
    metadata: { hasToken: !!token }
  });
  
  if (!token) {
    socketLogger.log({
      event: 'auth_error',
      socketId: socket.id,
      error: 'Missing auth token'
    });
    return next();
  }

  socket.data.token = token;
  next();
});

// Connection health monitoring
const connectionHealth = new Map();

io.on('connection', (socket) => {
  socketLogger.log({
    event: 'connected',
    socketId: socket.id
  });
  console.log('Client connected:', socket.id);
  const connectionStart = Date.now();
  
  connectionHealth.set(socket.id, {
    connectedAt: Date.now(),
    lastPing: Date.now(),
    status: 'healthy'
  });

  // Monitor connection health
  const healthCheck = setInterval(() => {
    const health = connectionHealth.get(socket.id);
    if (health) {
      const now = Date.now();
      const lastPing = health.lastPing;
      if (now - lastPing > 30000) { // 30 seconds
        health.status = 'degraded';
        connectionHealth.set(socket.id, health);
        socket.emit('connection:degraded');
      }
    }
  }, 10000);

  socket.on('ping', () => {
    const latency = Date.now() - connectionStart;
    socketMonitor.recordLatency(socket.id, latency);
    socketMonitor.recordPing(socket.id);
    socketLogger.log({
      event: 'ping',
      socketId: socket.id,
      metadata: { latency }
    });
    const health = connectionHealth.get(socket.id);
    if (health) {
      health.lastPing = Date.now();
      health.status = 'healthy';
      connectionHealth.set(socket.id, health);
    }
    socket.emit('pong');
  });

  socket.on('join', (roomId, callback) => {
    try {
      if (!roomId) {
        const error = 'Join attempt without room ID';
        socketMonitor.recordError(socket.id, error);
        socketLogger.log({
          event: 'join_error',
          socketId: socket.id,
          error
        });
        callback?.({ success: false, error });
        return;
      }

      socket.join(roomId);
      socketLogger.log({
        event: 'room_joined',
        socketId: socket.id,
        data: { roomId }
      });
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      callback?.({ success: true });
      
      socket.to(roomId).emit('userJoined', {
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      const error = err as Error;
      console.error('Error joining room:', error);
      socketMonitor.recordError(socket.id, `Join room error: ${error.message}`);
      socketLogger.log({
        event: 'join_error',
        socketId: socket.id,
        error: error.message
      });
      callback?.({ success: false, error: error?.message || 'Unknown error occurred' });
    }
  });

  socket.on('message', async (data, callback) => {
    try {
      if (!data || !data.roomId) {
        const error = 'Invalid message format';
        socketMonitor.recordError(socket.id, error);
        socketLogger.log({
          event: 'message_error',
          socketId: socket.id,
          error,
          data
        });
        callback?.({ success: false, error });
        return;
      }

      if (!socket.rooms.has(data.roomId)) {
        socket.join(data.roomId);
      }

      const messageData = {
        ...data,
        timestamp: new Date().toISOString(),
      };

      socket.to(data.roomId).emit('message', messageData);
      socketMonitor.recordMessageSent(socket.id);
      socketLogger.log({
        event: 'message_sent',
        socketId: socket.id,
        data: { roomId: data.roomId }
      });
      
      callback?.({ 
        success: true, 
        messageData,
        timestamp: messageData.timestamp
      });
    } catch (err) {
      const error = err as Error;
      console.error('Error broadcasting message:', error);
      socketMonitor.recordError(socket.id, `Message broadcast error: ${error.message}`);
      socketLogger.log({
        event: 'message_error',
        socketId: socket.id,
        error: error.message,
        data
      });
      callback?.({ 
        success: false, 
        error: error?.message || 'Failed to broadcast message'
      });
    }
  });

  socket.on('error', (error) => {
    console.error(`Socket ${socket.id} error:`, error);
    socketMonitor.recordError(socket.id, error.toString());
    socketLogger.log({
      event: 'socket_error',
      socketId: socket.id,
      error: error.toString()
    });
    const health = connectionHealth.get(socket.id);
    if (health) {
      health.status = 'error';
      health.lastError = error;
      connectionHealth.set(socket.id, health);
    }
  });

  socket.on('disconnect', () => {
    socketLogger.log({
      event: 'disconnected',
      socketId: socket.id
    });
    console.log('Client disconnected:', socket.id);
    socketMonitor.updateConnectionDuration(socket.id);
    socketMonitor.clearMetrics(socket.id);
    clearInterval(healthCheck);
    connectionHealth.delete(socket.id);
  });
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    res.socket.server.io = io;
  }
  res.status(200).json({ message: 'Socket server running' });
}