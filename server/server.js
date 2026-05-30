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

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  // Client tells us which user they are
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`)
    console.log(`User ${userId} joined their room`)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Export io so controllers can use it
export { io }

if (process.env.NODE_ENV === 'production') {
  setupBot()
}

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})