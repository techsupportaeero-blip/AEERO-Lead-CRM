import { z } from 'zod';

export const followUpTypeEnum = z.enum(['CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'OTHER']);
export const followUpStatusEnum = z.enum(['PENDING', 'COMPLETED', 'MISSED', 'CANCELLED']);

export const createFollowupSchema = z.object({
  leadId: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
  date: z.string().min(1, 'Follow-up date is required (YYYY-MM-DD)'),
  time: z.string().optional().default('10:00'),
  type: z.string().optional().default('CALL'),
  notes: z.string().optional().nullable(),
  status: z.string().optional().default('PENDING'),
  createdBy: z.string().optional()
});

export const updateFollowupSchema = z.object({
  assignedTo: z.string().optional().nullable(),
  date: z.string().optional(),
  time: z.string().optional(),
  type: z.string().optional(),
  notes: z.string().optional().nullable(),
  status: z.string().optional()
});
