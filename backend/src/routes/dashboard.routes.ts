import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const dashboardRouter = Router();

// Dashboard summary and stats endpoints (both /stats and /dashboard/summary supported)
dashboardRouter.get('/stats', authMiddleware, DashboardController.getSummary);
dashboardRouter.get('/dashboard/summary', authMiddleware, DashboardController.getSummary);
dashboardRouter.get('/config', authMiddleware, DashboardController.getConfig);
