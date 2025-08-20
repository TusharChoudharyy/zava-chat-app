const express = require('express')
const mongoose = require('mongoose')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
require('dotenv').config();
const authroute = require('./routes/auth')

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
    
  }
})

// Middleware
app.use(cors())
app.use(express.json());

app.use('/api/auth', authroute)

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err))

// Socket.IO

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
