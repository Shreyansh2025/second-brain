import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './config/db.js'
import errorhandler from './middleware/errorHandler.js'
import resourceRoutes from './routes/resourceRoutes.js'
import authRoutes from './routes/authRoutes.js'
import { setupBot } from './bot/telegramBot.js'
import jwt from 'jsonwebtoken'
import User from './models/User.js'

connectDB()

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api/auth', authRoutes)
app.use('/api/resources', resourceRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Second Brain API is running' })
})

app.use(errorhandler)

// Create HTTP server — Socket.io needs this
const httpServer = createServer(app)

// Setup Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  }
})

// Authenticate every Socket.IO connection using the existing JWT.
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token

    if (typeof token !== 'string' || !token) {
      return next(new Error('Authentication required'))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (typeof decoded !== 'object' || !decoded.id) {
      return next(new Error('Invalid authentication token'))
    }

    const user = await User.findById(decoded.id).select('_id')

    if (!user) {
      return next(new Error('User not found'))
    }

    // Identity comes from the verified token and database,
    // never from a user ID supplied by the client.
    socket.data.userId = user._id.toString()

    next()
  } catch {
    next(new Error('Authentication failed'))
  }
})

io.on('connection', (socket) => {
  const userId = socket.data.userId

  // Only the verified user can join this room.
  socket.join(`user:${userId}`)

  console.log(`Authenticated socket connected: ${socket.id}`)
  console.log(`User ${userId} joined their room`)

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Export io so controllers can use it.
export { io }

if (process.env.NODE_ENV === 'production') {
  setupBot()
}

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})