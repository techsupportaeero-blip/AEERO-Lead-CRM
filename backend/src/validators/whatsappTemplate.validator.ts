import { z } from 'zod';

export const createWhatsAppTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required').trim(),
  name: z.string().min(1, 'Template name is required').trim(),
  body: z.string().min(1, 'Template body is required'),
  variableCount: z.union([z.number(), z.string().transform(v => parseInt(v, 10))]).optional().default(0),
  isActive: z.boolean().optional()
});

export const updateWhatsAppTemplateSchema = z.object({
  templateId: z.string().min(1).trim().optional(),
  name: z.string().min(1).trim().optional(),
  body: z.string().min(1).optional(),
  variableCount: z.union([z.number(), z.string().transform(v => parseInt(v, 10))]).optional(),
  isActive: z.boolean().optional()
});
