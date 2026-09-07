import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLog.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';

export const auditLogRouter = Router();

auditLogRouter.get('/audit-logs', optionalAuthMiddleware, AuditLogController.getAuditLogs);
