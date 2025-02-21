import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import { createServer } from 'http'
// import path from 'path' // Import the path module here
import metadataRoutes from './routes/metadata.js'

// Configure environment variables
dotenv.config()

// Create Express app
const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
// app.use(express.static(path.join(__dirname, 'dist'))) // Serve static files from dist

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
})

// Routes
app.use('/upload', upload.single('photo'), metadataRoutes)

// Create HTTP server
const server = createServer(app)

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
