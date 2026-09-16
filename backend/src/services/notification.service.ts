import { prisma } from '../config/database.js';

export class NotificationService {
  static async createNotification(userId: number | undefined, title: string, message: string, type = 'info') {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          isRead: false
        }
      });

      // Push live so it shows up instantly instead of waiting for the next
      // poll/page load - mirrors the 'newLead' socket pattern already used
      // for real-time lead updates.
      (global as any).io?.emit('notification', notification);

      return notification;
    } catch (err) {
      console.error('Failed to create notification:', err);
      return null;
    }
  }

  /**
   * Resolve a counselor/staff NAME (e.g. Lead.ownerId, Task.assignedTo -
   * both plain strings, not User FKs) to that User's id and notify them.
   * Silently no-ops if no matching active user is found, since ownerId
   * sometimes holds a name that isn't (yet) a real User record.
   */
  static async notifyUserByName(name: string | null | undefined, title: string, message: string, type = 'info') {
    if (!name || !name.trim()) return null;
    try {
      const user = await prisma.user.findFirst({
        where: { name: { equals: name.trim(), mode: 'insensitive' } }
      });
      if (!user) return null;
      return await NotificationService.createNotification(user.id, title, message, type);
    } catch (err) {
      console.error('Failed to resolve user for notification:', err);
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
