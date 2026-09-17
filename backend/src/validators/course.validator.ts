import { z } from 'zod';

export const createCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required').trim().toUpperCase(),
  name: z.string().min(1, 'Course name is required').trim(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  price: z.union([z.number(), z.string().transform(v => parseFloat(v))]).optional().default(0),
  status: z.string().optional(),
  // No .default(true) here - CourseService.resolveIsActive() already
  // defaults to true when nothing is provided, and a Zod default would
  // otherwise inject `active: true` before that logic ever sees `status`,
  // silently overriding an explicit "Inactive" on create.
  active: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const updateCourseSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  price: z.union([z.number(), z.string().transform(v => parseFloat(v))]).optional(),
  status: z.string().optional(),
  active: z.boolean().optional(),
  isActive: z.boolean().optional()
});
