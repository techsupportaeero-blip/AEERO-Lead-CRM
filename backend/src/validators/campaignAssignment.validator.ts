import { z } from 'zod';

export const setCampaignAssignmentSchema = z.object({
  campaignName: z.string().min(1, 'campaignName is required').trim(),
  ownerId: z.string().min(1, 'ownerId is required').trim(),
  reassignExisting: z.boolean().optional()
});
