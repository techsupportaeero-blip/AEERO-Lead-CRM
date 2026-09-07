import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';

export const notificationRouter = Router();

notificationRouter.get('/notifications', optionalAuthMiddleware, NotificationController.getNotifications);
notificationRouter.put('/notifications/:id/read', optionalAuthMiddleware, NotificationController.markAsRead);
