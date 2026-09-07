import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : req.user?.userId;
      const notifications = await NotificationService.getNotifications(userId);
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await NotificationService.markAsRead(id);
      res.json(updated || { success: true });
    } catch (err) {
      next(err);
    }
  }
}
