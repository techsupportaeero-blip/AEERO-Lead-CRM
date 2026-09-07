import { prisma } from '../config/database.js';
import { TaskStatus, Priority } from '../types/index.js';
import { LeadService } from './lead.service.js';

export class TaskService {
  static normalizeStatus(statusStr?: string | null): TaskStatus {
    if (!statusStr) return TaskStatus.PENDING;
    const upper = String(statusStr).toUpperCase().replace(/[-\s]/g, '_');
    if (Object.values(TaskStatus).includes(upper as TaskStatus)) {
      return upper as TaskStatus;
    }
    if (upper.includes('PROGRESS')) return TaskStatus.IN_PROGRESS;
    if (upper.includes('COMPLET')) return TaskStatus.COMPLETED;
    if (upper.includes('CANCEL')) return TaskStatus.CANCELLED;
    return TaskStatus.PENDING;
  }

  static formatTask(task: any) {
    if (!task) return null;
    const statusMap: Record<string, string> = {
      PENDING: 'Pending',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled'
    };
    const priorityMap: Record<string, string> = {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      URGENT: 'Urgent'
    };

    return {
      ...task,
      taskId: task.id,
      assignedUser: task.assignedTo,
      status: statusMap[task.status] || task.status,
      priority: priorityMap[task.priority] || task.priority
    };
  }

  static async getTasks(filters: any = {}) {
    const where: any = {};
    if (filters.leadId) {
      where.leadId = String(filters.leadId);
    }
    if (filters.status && filters.status !== 'All') {
      where.status = this.normalizeStatus(filters.status);
    }
    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        lead: {
          select: {
            id: true,
            leadId: true,
            name: true,
            mobile: true
          }
        }
      }
    });

    return tasks.map(t => this.formatTask(t));
  }

  static async addTask(data: any, createdBy = 'Counselor') {
    let leadRelId: number | undefined;
    let leadId = data.leadId;

    if (leadId) {
      const lead = await LeadService.getLeadById(leadId);
      if (lead) {
        leadRelId = lead.id;
        leadId = lead.leadId;
      }
    }

    const created = await prisma.task.create({
      data: {
        leadId: leadId || null,
        leadRelId,
        assignedTo: data.assignedTo || data.assignedUser || 'MS. INDU',
        title: data.title.trim(),
        description: data.description || null,
        priority: (data.priority?.toUpperCase() as Priority) || Priority.MEDIUM,
        dueDate: data.dueDate || null,
        dueTime: data.dueTime || '11:00 AM',
        status: this.normalizeStatus(data.status),
        createdBy: createdBy || 'Counselor'
      }
    });

    return this.formatTask(created);
  }

  static async updateTask(id: number, data: any) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.assignedTo !== undefined || data.assignedUser !== undefined) {
      updateData.assignedTo = data.assignedTo || data.assignedUser;
    }
    if (data.priority !== undefined) {
      updateData.priority = data.priority.toUpperCase() as Priority;
    }
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.dueTime !== undefined) updateData.dueTime = data.dueTime;
    if (data.status !== undefined) updateData.status = this.normalizeStatus(data.status);

    const updated = await prisma.task.update({
      where: { id },
      data: updateData
    });

    return this.formatTask(updated);
  }

  static async deleteTask(id: number) {
    return prisma.task.delete({
      where: { id }
    });
  }
}
