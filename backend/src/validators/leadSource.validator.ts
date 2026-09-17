import { z } from 'zod';

export const createLeadSourceSchema = z.object({
  name: z.string().min(1, 'Lead source name is required').trim(),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  costPerLead: z.string().optional().nullable(),
  status: z.string().optional(),
  // No .default(true) here - LeadSourceService's resolveIsActive() already
  // defaults to true when nothing is provided, and a Zod default would
  // otherwise inject `active: true` before that logic ever sees `status`,
  // silently overriding an explicit "Inactive" on create.
  active: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const updateLeadSourceSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  costPerLead: z.string().optional().nullable(),
  status: z.string().optional(),
  active: z.boolean().optional(),
  isActive: z.boolean().optional()
});
