import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username or Email is required').trim(),
  password: z.string().min(1, 'Password is required')
});

export const registerUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').trim(),
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'LEAD_FINDER', 'VIEWER']).default('LEAD_FINDER')
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'LEAD_FINDER', 'VIEWER']).optional(),
  isActive: z.boolean().optional()
});
