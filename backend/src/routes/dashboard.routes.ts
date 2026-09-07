import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';

export const dashboardRouter = Router();

// Dashboard summary and stats endpoints (both /stats and /dashboard/summary supported)
dashboardRouter.get('/stats', optionalAuthMiddleware, DashboardController.getSummary);
dashboardRouter.get('/dashboard/summary', optionalAuthMiddleware, DashboardController.getSummary);
dashboardRouter.get('/config', optionalAuthMiddleware, DashboardController.getConfig);
