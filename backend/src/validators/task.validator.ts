import { z } from 'zod';

export const taskStatusEnum = z.preprocess(
  (val) => {
    if (typeof val !== 'string') return val;
    const upper = val.toUpperCase().replace(/[-\s]/g, '_');
    if (upper.includes('PROGRESS')) return 'IN_PROGRESS';
    if (upper.includes('COMPLET')) return 'COMPLETED';
    if (upper.includes('CANCEL')) return 'CANCELLED';
    return 'PENDING';
  },
  z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
);

export const priorityEnum = z.preprocess(
  (val) => {
    if (typeof val === 'string') return val.toUpperCase();
    return val;
  },
  z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
);

export const createTaskSchema = z.object({
  leadId: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().optional().nullable()
  ),
  assignedTo: z.string().optional().nullable(),
  assignedUser: z.string().optional().nullable(),
  title: z.string().min(1, 'Task title is required').trim(),
  description: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().optional().nullable()
  ),
  priority: priorityEnum.optional().default('MEDIUM'),
  dueDate: z.string().optional().nullable(),
  dueTime: z.string().optional().nullable(),
  status: taskStatusEnum.optional().default('PENDING'),
  createdBy: z.string().optional()
});

export const updateTaskSchema = z.object({
  leadId: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().optional().nullable()
  ),
  assignedTo: z.string().optional().nullable(),
  assignedUser: z.string().optional().nullable(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  priority: priorityEnum.optional(),
  dueDate: z.string().optional().nullable(),
  dueTime: z.string().optional().nullable(),
  status: taskStatusEnum.optional()
});
