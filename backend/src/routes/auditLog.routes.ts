import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLog.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const auditLogRouter = Router();

auditLogRouter.get('/audit-logs', authMiddleware, AuditLogController.getAuditLogs);
