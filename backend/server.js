const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const kitRoutes = require('./routes/kits');
const transactionRoutes = require('./routes/transactions');
const userRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const tournamentRoutes = require('./routes/tournaments');
const teamRoutes = require('./routes/teams');
const fineRoutes = require('./routes/fines');
const chatbotRoutes = require('./routes/chatbot');
const auditRoutes = require('./routes/audit');
const alertRoutes = require('./routes/alerts');
const reservationRoutes = require('./routes/reservations');
const notificationRoutes = require('./routes/notifications');

// Import middleware
const { protect, adminOnly } = require('./middleware/auth');
const { initializeReminderEngine } = require('./ai/reminderEngine');

// Parse allowed origins
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',') 
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

console.log('Allowed CORS origins:', allowedOrigins);

// Middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(null, true); // Allow all in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join user-specific room for targeted notifications
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join admin room
  socket.on('join_admin', () => {
    socket.join('admin');
    console.log('Admin joined admin room');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/kits', protect, kitRoutes);
app.use('/api/transactions', protect, transactionRoutes);
app.use('/api/reservations', protect, reservationRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/analytics', protect, analyticsRoutes);
app.use('/api/ai', protect, aiRoutes);
app.use('/api/tournaments', protect, tournamentRoutes);
app.use('/api/teams', protect, teamRoutes);
app.use('/api/fines', protect, fineRoutes);
app.use('/api/chatbot', protect, chatbotRoutes);
app.use('/api/audit', protect, auditRoutes);
app.use('/api/notifications', protect, notificationRoutes);
app.use('/api/alerts', protect, alertRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ ERROR:', err.message);
  console.error('📍 Route:', req.method, req.originalUrl);
  console.error('📦 Body:', req.body);
  console.error('🔍 Stack:', err.stack);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err.toString()
    })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportkits';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Initialize reminder engine
    initializeReminderEngine(io);
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.io ready for real-time updates`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = { app, io };
