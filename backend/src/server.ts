import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { prisma, checkDatabaseConnection } from './config/database.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { globalRateLimiter } from './middleware/rateLimit.middleware.js';
import { logger } from './utils/logger.js';

const app = express();
const httpServer = createServer(app);
const PORT = env.PORT || 3001;

// 1. Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// 2. CORS Setup
const allowedOrigins = env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map(o => o.trim());
app.use(
  cors({
    origin: allowedOrigins === '*' ? true : allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-integration-secret']
  })
);

// Initialize Socket.io
export const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins === '*' ? true : allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// @ts-ignore
global.io = io;

io.on('connection', (socket) => {
  logger.info(`🔌 Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// 3. Request Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Rate Limiting
app.use('/api', globalRateLimiter);

// 5. API Routes
app.use('/api', apiRouter);

// 6. Root status endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AEERO Lead CRM Backend API',
    version: '1.0.0',
    status: 'online',
    documentation: '/api/health'
  });
});

// 7. Centralized Error Handling
app.use(errorHandler);

// 8. Start HTTP Server
const server = httpServer.listen(PORT, async () => {
  logger.info(`==================================================================`);
  logger.info(`🚀 AEERO CRM TypeScript Backend listening on http://localhost:${PORT}`);
  logger.info(`🔌 Socket.io enabled for real-time events.`);
  logger.info(`🌐 Environment: ${env.NODE_ENV}`);
  logger.info(`==================================================================`);

  // Check Database connection on startup (IPv4 Neon route)
  const dbConnected = await checkDatabaseConnection();
  if (dbConnected) {
    logger.info(`✅ Connected successfully to Neon PostgreSQL Database via Prisma ORM.`);
  } else {
    logger.warn(`⚠️ PostgreSQL Database is not yet accessible at: ${env.DATABASE_URL}.`);
  }
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use by another process. Kill the process or choose another port.`);
  } else {
    logger.error('Server error occurred:', err);
  }
});

// Graceful Shutdown
const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully shutting down AEERO CRM backend...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database connection closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;
