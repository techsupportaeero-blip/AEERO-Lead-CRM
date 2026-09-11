import { z } from 'zod';

// The rest of the codebase treats status/priority case-insensitively
// (LeadService.normalizeStatus/normalizePriority already accept "Medium",
// "medium", "MEDIUM", etc.) but forms in the UI send whatever casing their
// <option> values happen to use (e.g. AddLeadModal's Priority dropdown sends
// "Medium", not "MEDIUM"). Without this preprocess, a strict-cased z.enum()
// here rejects those requests before they ever reach the normalizer, so
// "Add Lead" fails validation for any priority other than an exact-cased
// match. Uppercase (and, for status, normalize separators) before checking
// the enum so the validator accepts the same casing the rest of the app does.
const caseInsensitiveEnum = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase().replace(/[-\s\/]/g, '_') : val),
    z.enum(values)
  );

export const leadStatusEnum = caseInsensitiveEnum([
  'NEW',
  'NO_ANSWER',
  'GIVEN_DETAILS',
  'INTERESTED',
  'FOLLOW_UP',
  'CONVERTED',
  'LOST',
  'NOT_INTERESTED',
  'INVALID'
]);

export const priorityEnum = caseInsensitiveEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  mobile: z.string().min(6, 'Valid mobile number is required').trim(),
  whatsappNumber: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  age: z.union([z.number(), z.string().transform(v => (v ? parseInt(v, 10) : undefined))]).optional().nullable(),
  qualification: z.string().optional().nullable(),
  interestedCourse: z.string().optional().nullable(),
  preferredStudyMode: z.string().optional().nullable(),
  requirement: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),

  // Management
  ownerId: z.string().optional().nullable(),
  status: leadStatusEnum.optional().default('NEW'),
  priority: priorityEnum.optional().default('MEDIUM'),
  tags: z.union([z.array(z.string()), z.string()]).optional().nullable(),

  // Source & Marketing Attribution
  source: z.string().min(1, 'Lead source is required').trim(),
  sourceId: z.number().optional().nullable(),
  platform: z.string().optional().nullable(),
  campaign: z.string().optional().nullable(),
  campaignId: z.string().optional().nullable(),
  adSet: z.string().optional().nullable(),
  adSetId: z.string().optional().nullable(),
  ad: z.string().optional().nullable(),
  adId: z.string().optional().nullable(),
  formId: z.string().optional().nullable(),

  // UTM
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
  utmContent: z.string().optional().nullable(),
  utmTerm: z.string().optional().nullable(),
  gclid: z.string().optional().nullable(),
  fbclid: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable(),

  // Flags
  allowDuplicate: z.boolean().optional().default(false),
  createdBy: z.string().optional()
});

export const publicLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  mobile: z.string().min(6, 'Valid mobile number is required').trim(),
  whatsappNumber: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  age: z.union([z.number(), z.string().transform(v => (v ? parseInt(v, 10) : undefined))]).optional().nullable(),
  qualification: z.string().optional().nullable(),
  interestedCourse: z.string().optional().nullable(),
  preferredStudyMode: z.string().optional().nullable(),
  requirement: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),

  // Attribution
  source: z.string().optional().default('Website'),
  platform: z.string().optional().nullable(),
  campaign: z.string().optional().nullable(),
  campaignId: z.string().optional().nullable(),
  adSet: z.string().optional().nullable(),
  adSetId: z.string().optional().nullable(),
  ad: z.string().optional().nullable(),
  adId: z.string().optional().nullable(),
  formId: z.string().optional().nullable(),

  // UTM
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
  utmContent: z.string().optional().nullable(),
  utmTerm: z.string().optional().nullable(),
  gclid: z.string().optional().nullable(),
  fbclid: z.string().optional().nullable(),
  landingPage: z.string().optional().nullable()
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  mobile: z.string().min(6).optional(),
  whatsappNumber: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  age: z.union([z.number(), z.string().transform(v => (v ? parseInt(v, 10) : undefined))]).optional().nullable(),
  qualification: z.string().optional().nullable(),
  interestedCourse: z.string().optional().nullable(),
  preferredStudyMode: z.string().optional().nullable(),
  requirement: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),

  ownerId: z.string().optional().nullable(),
  status: leadStatusEnum.optional(),
  priority: priorityEnum.optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  isArchived: z.boolean().optional(),

  source: z.string().optional(),
  platform: z.string().optional().nullable(),
  campaign: z.string().optional().nullable(),
  campaignId: z.string().optional().nullable(),
  adSet: z.string().optional().nullable(),
  adSetId: z.string().optional().nullable(),
  ad: z.string().optional().nullable(),
  adId: z.string().optional().nullable(),
  formId: z.string().optional().nullable(),

  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
  utmContent: z.string().optional().nullable(),
  utmTerm: z.string().optional().nullable(),

  updatedBy: z.string().optional()
});

export const checkDuplicateSchema = z.object({
  mobile: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  excludeId: z.union([z.string(), z.number()]).optional().nullable()
});
