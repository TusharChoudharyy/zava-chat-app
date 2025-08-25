const express = require('express')
const mongoose = require('mongoose')
const http = require('http')
const {Server} = require('socket.io')
const cors = require('cors')
require('dotenv').config();
const authroute = require('./routes/auth')

const app = express()
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// Middleware
app.use(cors())
app.use(express.json());

app.use('/api/auth', authroute)

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err))

// Socket.IO
let rooms = {}; // { roomId: { host: socketId, participants: [] } }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Create/Join Room
  socket.on("join-room", ({ roomId, isHost }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { host: isHost ? socket.id : null, participants: [] };
    }

    rooms[roomId].participants.push(socket.id);
    socket.join(roomId);

    io.to(roomId).emit("user-joined", { id: socket.id });
  });

  // Relay signals (WebRTC offer/answer/candidates)
  socket.on("signal", ({ roomId, to, data }) => {
    io.to(to).emit("signal", { from: socket.id, data });
  });

  // Host controls
  socket.on("host-action", ({ roomId, targetId, action }) => {
    if (rooms[roomId]?.host === socket.id) {
      io.to(targetId).emit("host-action", action);
    }
  });

  // Leave room
  socket.on("disconnect", () => {
    for (let roomId in rooms) {
      rooms[roomId].participants = rooms[roomId].participants.filter(
        (id) => id !== socket.id
      );
      io.to(roomId).emit("user-left", { id: socket.id });
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
