import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize, { testConnection } from './config/database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ============================================
// MIDDLEWARE
// ============================================

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Crisis Connect API is running',
    timestamp: new Date().toISOString()
  });
});

// Initialize model associations
import './models/index.js';

// [DEV1] Authentication routes
import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);

// [DEV1] Offer routes
import offerRoutes from './routes/offers.js';
app.use('/api/offers', offerRoutes);

// [DEV1] Request routes
import requestRoutes from './routes/requests.js';
app.use('/api/requests', requestRoutes);

// [DEV1] User routes - To be implemented
// import userRoutes from './routes/users.js';
// app.use('/api/users', userRoutes);

// [DEV1] Search routes - To be implemented
// import searchRoutes from './routes/search.js';
// app.use('/api/search', searchRoutes);

// [DEV1] Message routes
import messageRoutes from './routes/messages.js';
app.use('/api/messages', messageRoutes);

// [DEV1] Conversation routes
import conversationRoutes from './routes/conversations.js';
app.use('/api/conversations', conversationRoutes);

// [DEV2] Blockage routes
import blockageRoutes from './routes/blockages.js';
app.use('/api/blockages', blockageRoutes);

// [DEV2] Notification routes
import notificationRoutes from './routes/notifications.js';
app.use('/api/notifications', notificationRoutes);

// [DEV2] Medical facilities proxy (Overpass API — avoids browser CORS)
import medicalFacilitiesRoutes from './routes/medicalFacilities.js';
app.use('/api/medical-facilities', medicalFacilitiesRoutes);

// [DEV2] Weather routes - Developer 2 will implement
// import weatherRoutes from './routes/weather.js';
// app.use('/api/weather', weatherRoutes);

// [DEV2] Route visualization - Developer 2 will implement
// import routeRoutes from './routes/routes.js';
// app.use('/api/routes', routeRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// SERVER INITIALIZATION
// ============================================

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.warn('⚠ Server starting without database connection');
      console.warn('⚠ Make sure PostgreSQL is running and credentials are correct');
    }

    // Start the server
    app.listen(PORT, () => {
      console.log('===========================================');
      console.log(`🚀 Crisis Connect Backend Server Running`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🗄️  Database: ${dbConnected ? 'Connected ✓' : 'Not Connected ✗'}`);
      console.log('===========================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
