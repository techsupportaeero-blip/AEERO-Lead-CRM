import { prisma } from '../config/database.js';

export class NotificationService {
  static async createNotification(userId: number | undefined, title: string, message: string, type = 'info') {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          isRead: false
        }
      });
    } catch (err) {
      console.error('Failed to create notification:', err);
      return null;
    }
  }

  static async getNotifications(userId?: number) {
    const where = userId ? { userId } : {};
    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  static async markAsRead(id: number) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }
}
