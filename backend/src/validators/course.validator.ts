import { z } from 'zod';

export const createCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required').trim().toUpperCase(),
  name: z.string().min(1, 'Course name is required').trim(),
  description: z.string().optional().nullable(),
  price: z.union([z.number(), z.string().transform(v => parseFloat(v))]).optional().default(0),
  active: z.boolean().optional().default(true),
  isActive: z.boolean().optional()
});

export const updateCourseSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.union([z.number(), z.string().transform(v => parseFloat(v))]).optional(),
  active: z.boolean().optional(),
  isActive: z.boolean().optional()
});
