import 'dotenv/config'
import { setupBot } from './bot/telegramBot.js'
import express from 'express'
import cors from 'cors'
import connectDB from './config/db.js'
import errorhandler from './middleware/errorHandler.js'
import resourceRoutes from './routes/resourceRoutes.js'
import authRoutes from './routes/authRoutes.js'

connectDB()
setupBot()

const app = express()
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Added OPTIONS explicitly
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'], // Added your custom header here!
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api/resources', resourceRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/resources', resourceRoutes)
app.get('/', (req, res) => {
  res.json({ message: 'Second Brain API is running' })
})

app.use(errorhandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})