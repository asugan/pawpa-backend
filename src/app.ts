import express from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';

const app = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(corsMiddleware);

// Rate limiting
app.use(rateLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'PawPa Backend API is running',
      version: 'v1',
      endpoints: {
        pets: '/api/pets',
        healthRecords: '/api/health-records',
        events: '/api/events',
        feedingSchedules: '/api/feeding-schedules',
      },
    },
  });
});

// Mount API routes after the info endpoint
app.use('/api', apiRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

export default app;