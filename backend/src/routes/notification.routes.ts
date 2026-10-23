import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const notificationRouter = Router();

notificationRouter.get('/notifications', authMiddleware, NotificationController.getNotifications);
notificationRouter.put('/notifications/:id/read', authMiddleware, NotificationController.markAsRead);
