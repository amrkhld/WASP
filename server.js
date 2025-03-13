const { createServer } = require('http');
const { Server } = require('socket.io');
const { parse } = require('url');
const { SocketRateLimiter } = require('./src/app/utils/socketRateLimit');

// Server metrics and rate limiter initialization
const metrics = {
  connectedClients: 0,
  messageCount: 0,
  errorCount: 0,
  roomCount: 0,
  startTime: Date.now(),
  lastMinuteMessages: [],
  lastMinuteErrors: []
};

const rateLimiter = new SocketRateLimiter({
  points: 50,          // 50 messages
  duration: 60,        // per minute
  blockDuration: 300   // 5 minute block if exceeded
});

const updateMetrics = (type, data = null) => {
  const now = Date.now();
  switch (type) {
    case 'connection':
      metrics.connectedClients++;
      break;
    case 'disconnect':
      metrics.connectedClients--;
      break;
    case 'message':
      metrics.messageCount++;
      metrics.lastMinuteMessages.push(now);
      break;
    case 'error':
      metrics.errorCount++;
      metrics.lastMinuteErrors.push({ timestamp: now, error: data });
      break;
    case 'roomUpdate':
      metrics.roomCount = activeRooms.size;
      break;
  }

  // Clean up old metrics
  const oneMinuteAgo = now - 60000;
  metrics.lastMinuteMessages = metrics.lastMinuteMessages.filter(t => t > oneMinuteAgo);
  metrics.lastMinuteErrors = metrics.lastMinuteErrors.filter(e => e.timestamp > oneMinuteAgo);
};

const port = process.env.PORT || process.env.SOCKET_PORT || 3001;
const INACTIVE_ROOM_TIMEOUT = 1000 * 60 * 60; // 1 hour

const httpServer = createServer((req, res) => {
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const { pathname } = parse(req.url);
  
  // Enhanced health check endpoint
  if (pathname === '/health') {
    const healthStatus = {
      status: 'healthy',
      service: 'socket-server',
      timestamp: new Date().toISOString(),
      activeRooms: Array.from(activeRooms.entries()).map(([id, room]) => ({
        id,
        memberCount: room.members.size,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity
      }))
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthStatus));
    return;
  }

  // Enhanced metrics endpoint
  if (pathname === '/metrics') {
    const currentMetrics = {
      ...metrics,
      uptime: Date.now() - metrics.startTime,
      messageRate: metrics.lastMinuteMessages.length / 60,
      errorRate: metrics.lastMinuteErrors.length / 60,
      activeRooms: Array.from(activeRooms.entries()).map(([id, room]) => ({
        id,
        memberCount: room.members.size,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity
      })),
      rateLimits: Array.from(rateLimiter.getLimits()).map(([socketId, info]) => ({
        socketId,
        points: info.points,
        isBlocked: info.blockedUntil ? info.blockedUntil > Date.now() : false
      }))
    };

    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(currentMetrics));
    return;
  }

  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
  path: '/api/socket',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

const activeRooms = new Map();

// Room cleanup interval
setInterval(() => {
  const now = Date.now();
  activeRooms.forEach((room, roomId) => {
    if (now - room.lastActivity > INACTIVE_ROOM_TIMEOUT && room.members.size === 0) {
      activeRooms.delete(roomId);
      io.emit('roomClosed', {
        roomId,
        reason: 'inactivity',
        timestamp: new Date().toISOString()
      });
    }
  });
}, 1000 * 60 * 15); // Check every 15 minutes

io.on('connection', (socket) => {
  updateMetrics('connection');
  console.log('Client connected:', socket.id);

  socket.on('join', (roomId, callback) => {
    try {
      if (rateLimiter.isRateLimited(socket.id)) {
        const status = rateLimiter.getBlockStatus(socket.id);
        callback?.({
          success: false,
          error: `Rate limit exceeded. ${status.remainingTime ? `Try again in ${status.remainingTime}s.` : ''}`
        });
        return;
      }

      if (!roomId) {
        callback?.({ success: false, error: 'Room ID is required' });
        return;
      }

      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, {
          createdAt: new Date().toISOString(),
          createdBy: socket.id,
          members: new Set(),
          lastActivity: Date.now()
        });
      }

      const room = activeRooms.get(roomId);
      room.members.add(socket.id);
      room.lastActivity = Date.now();
      socket.join(roomId);
      
      // Notify room members
      socket.to(roomId).emit('userJoined', {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
        memberCount: room.members.size
      });

      updateMetrics('roomUpdate');
      callback?.({ 
        success: true,
        roomInfo: {
          memberCount: room.members.size,
          createdAt: room.createdAt
        }
      });
    } catch (error) {
      updateMetrics('error', error);
      console.error('Error joining room:', error);
      callback?.({ success: false, error: error.message });
    }
  });

  socket.on('message', async (data, callback) => {
    try {
      if (rateLimiter.isRateLimited(socket.id)) {
        const status = rateLimiter.getBlockStatus(socket.id);
        callback?.({
          success: false,
          error: `Rate limit exceeded. ${status.remainingTime ? `Try again in ${status.remainingTime}s.` : ''}`
        });
        return;
      }

      if (!data?.roomId || !data?.content) {
        callback?.({ success: false, error: 'Invalid message format' });
        return;
      }

      const room = activeRooms.get(data.roomId);
      if (!room) {
        callback?.({ success: false, error: 'Room not found' });
        return;
      }

      room.lastActivity = Date.now();
      const messageData = {
        ...data,
        timestamp: new Date().toISOString(),
      };

      socket.to(data.roomId).emit('message', messageData);
      
      // Acknowledge message receipt
      updateMetrics('message');
      callback?.({ 
        success: true, 
        messageData,
        timestamp: messageData.timestamp,
        rateLimit: {
          remaining: rateLimiter.getRemainingPoints(socket.id)
        }
      });
    } catch (error) {
      updateMetrics('error', error);
      console.error('Error broadcasting message:', error);
      callback?.({ 
        success: false, 
        error: error.message || 'Failed to broadcast message'
      });
    }
  });

  socket.on('disconnect', () => {
    rateLimiter.removeClient(socket.id);
    updateMetrics('disconnect');
    activeRooms.forEach((room, roomId) => {
      if (room.members.has(socket.id)) {
        room.members.delete(socket.id);
        room.lastActivity = Date.now();

        // Notify remaining members
        socket.to(roomId).emit('userLeft', {
          socketId: socket.id,
          timestamp: new Date().toISOString(),
          memberCount: room.members.size
        });

        // Clean up empty rooms created by this user
        if (room.members.size === 0 && room.createdBy === socket.id) {
          activeRooms.delete(roomId);
          io.emit('roomClosed', {
            roomId,
            reason: 'creator-left',
            timestamp: new Date().toISOString()
          });
        }
      }
    });
    updateMetrics('roomUpdate');
    console.log('Client disconnected:', socket.id);
  });
});

// Enhanced error handling for the server
httpServer.on('error', (error) => {
  updateMetrics('error', error);
  console.error('Server error:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  updateMetrics('error', error);
  console.error('Uncaught Exception:', error);
  // Allow the process to exit if it's a critical error
  if (error.message.includes('EADDRINUSE') || error.message.includes('EACCES')) {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  updateMetrics('error', reason);
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const shutdown = (signal) => {
  console.log(`${signal} received. Closing server...`);
  
  // Stop accepting new connections
  httpServer.close(() => {
    console.log('Server closed');
    
    // Close all socket connections
    io.close(() => {
      console.log('Socket.IO server closed');
      
      // Exit the process
      process.exit(0);
    });
  });

  // Force exit if graceful shutdown fails
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Socket.IO server running on port ${port}`);
  console.log(`Allowing connections from: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}`);
});
