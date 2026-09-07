import { z } from 'zod';

export const activityTypeEnum = z.enum([
  'CALL',
  'WHATSAPP',
  'EMAIL',
  'SMS',
  'MEETING',
  'VIDEO_CALL',
  'NOTE',
  'OTHER'
]);

export const createActivitySchema = z.object({
  type: activityTypeEnum.optional().default('CALL'),
  activityType: z.string().optional(),
  outcome: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  duration: z.union([z.number(), z.string().transform(v => parseInt(v, 10))]).optional().default(5),
  durationMinutes: z.number().optional(),
  remarks: z.string().optional().nullable(),
  additionalInformation: z.string().optional().nullable(),
  participants: z.string().optional().nullable(),
  attachmentUrl: z.string().optional().nullable(),
  createdBy: z.string().optional(),
  // For quick follow-up scheduling from activity modal
  followUpDate: z.string().optional().nullable(),
  followUpTime: z.string().optional().nullable(),
  leadStatus: z.string().optional().nullable()
});
