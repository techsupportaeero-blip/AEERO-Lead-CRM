import { z } from 'zod';

const roleEnum = z.enum(['ADMIN', 'MANAGER', 'SR_COUNSELLOR', 'LEAD_FINDER', 'VIEWER']);

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  username: z.string().min(1, 'Username is required').trim(),
  email: z.string().email('Invalid email address').trim(),
  phone: z.string().optional().nullable(),
  role: roleEnum.optional().default('LEAD_FINDER'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const updateUserSchema = z.object({
  name: z.string().min(1).trim().optional(),
  username: z.string().min(1).trim().optional(),
  email: z.string().email().trim().optional(),
  phone: z.string().optional().nullable(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional()
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
});
