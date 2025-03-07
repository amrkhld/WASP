const { createServer } = require('http');
const { Server } = require('socket.io');
const { parse } = require('url');

const port = process.env.SOCKET_PORT || 3001;

const httpServer = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const { pathname } = parse(req.url);
  if (pathname === '/health') {
    res.writeHead(200);
    res.end('healthy');
    return;
  }

  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io/', 
  transports: ['polling', 'websocket']
});

const activeRooms = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (roomId, callback) => {
    try {
      if (!roomId) {
        callback?.({ success: false, error: 'Room ID is required' });
        return;
      }

      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, {
          createdAt: new Date().toISOString(),
          createdBy: socket.id,
          members: new Set()
        });
      }

      const room = activeRooms.get(roomId);
      room.members.add(socket.id);
      socket.join(roomId);
      
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      callback?.({ success: true });
      
      socket.to(roomId).emit('userJoined', {
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error joining room:', error);
      callback?.({ success: false, error: error.message });
    }
  });

  socket.on('message', async (data, callback) => {
    try {
      if (!data || !data.roomId) {
        callback?.({ success: false, error: 'Invalid message format' });
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
      

      callback?.({ 
        success: true, 
        messageData,
        timestamp: messageData.timestamp
      });
    } catch (error) {
      console.error('Error broadcasting message:', error);
      callback?.({ 
        success: false, 
        error: error.message || 'Failed to broadcast message'
      });
    }
  });

  socket.on('disconnect', () => {

    activeRooms.forEach((room, roomId) => {
      room.members.delete(socket.id);
      if (room.members.size === 0 && room.createdBy === socket.id) {
        activeRooms.delete(roomId);
        io.to(roomId).emit('roomClosed', {
          roomId,
          timestamp: new Date().toISOString()
        });
      }
    });
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(port, () => {
  console.log(`Socket.IO server running on port ${port}`);
});
