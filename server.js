const { Server } = require("socket.io");
const port = process.env.PORT || 3001;

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  path: "/socket.io"
});

io.on("connection", (socket) => {
  console.log("Client connected");
  
  socket.on("join", (roomId) => {
    socket.join(roomId);
    console.log(`Client joined room: ${roomId}`);
  });

  socket.on("message", (messageData, callback) => {
    io.to(messageData.roomId).emit("message", messageData);
    callback({ success: true, messageData });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

io.listen(port);
console.log(`Socket.IO server running on port ${port}`);
