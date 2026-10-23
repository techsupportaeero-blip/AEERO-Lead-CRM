import { z } from 'zod';

export const createCustomerSchema = z.object({
  leadId: z.string().optional().nullable(),
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).trim().optional(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});
