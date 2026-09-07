import { Router } from 'express';
import { checkDatabaseConnection } from '../config/database.js';

export const healthRouter = Router();

healthRouter.get('/health', async (req, res) => {
  const dbOk = await checkDatabaseConnection();
  res.status(dbOk ? 200 : 503).json({
    success: dbOk,
    status: dbOk ? 'ok' : 'degraded',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});
