import { z } from 'zod';

export const createNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required').trim(),
  isPinned: z.boolean().optional().default(false),
  createdBy: z.string().optional()
});

export const updateNoteSchema = z.object({
  content: z.string().min(1).optional(),
  isPinned: z.boolean().optional()
});
