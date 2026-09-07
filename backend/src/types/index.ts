export const Role = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  LEAD_FINDER: 'LEAD_FINDER',
  VIEWER: 'VIEWER'
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const LeadStatus = {
  NEW: 'NEW',
  NO_ANSWER: 'NO_ANSWER',
  GIVEN_DETAILS: 'GIVEN_DETAILS',
  INTERESTED: 'INTERESTED',
  FOLLOW_UP: 'FOLLOW_UP',
  CONVERTED: 'CONVERTED',
  LOST: 'LOST',
  NOT_INTERESTED: 'NOT_INTERESTED',
  INVALID: 'INVALID'
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const ActivityType = {
  CALL: 'CALL',
  WHATSAPP: 'WHATSAPP',
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  MEETING: 'MEETING',
  VIDEO_CALL: 'VIDEO_CALL',
  NOTE: 'NOTE',
  OTHER: 'OTHER'
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const FollowUpType = {
  CALL: 'CALL',
  WHATSAPP: 'WHATSAPP',
  EMAIL: 'EMAIL',
  MEETING: 'MEETING',
  OTHER: 'OTHER'
} as const;
export type FollowUpType = (typeof FollowUpType)[keyof typeof FollowUpType];

export const FollowUpStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  MISSED: 'MISSED',
  CANCELLED: 'CANCELLED'
} as const;
export type FollowUpStatus = (typeof FollowUpStatus)[keyof typeof FollowUpStatus];

export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export interface LeadItem {
  id: number;
  leadId: string;
  name: string;
  mobile: string;
  whatsappNumber?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  age?: number | null;
  qualification?: string | null;
  interestedCourse?: string | null;
  preferredStudyMode?: string | null;
  requirement?: string | null;
  remarks?: string | null;
  ownerId?: string | null;
  status: LeadStatus;
  priority: Priority;
  tags?: string | null;
  isArchived: boolean;
  sourceId?: number | null;
  source?: string | null;
  platform?: string | null;
  campaign?: string | null;
  campaignId?: string | null;
  adSet?: string | null;
  adSetId?: string | null;
  ad?: string | null;
  adId?: string | null;
  formId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  landingPage?: string | null;
  externalLeadId?: string | null;
  externalSource?: string | null;
  leadDateTime?: Date | string;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  payments?: any[];
}

export interface ActivityItem {
  id: number;
  leadId: string;
  leadRelId?: number | null;
  userId?: number | null;
  type: ActivityType;
  activityType?: string | null;
  outcome?: string | null;
  subject?: string | null;
  description?: string | null;
  durationMinutes?: number | null;
  remarks?: string | null;
  additionalInformation?: string | null;
  participants?: string | null;
  attachmentUrl?: string | null;
  createdBy?: string | null;
  createdAt: Date;
}

export interface FollowUpItem {
  id: number;
  leadId: string;
  leadRelId?: number | null;
  assignedTo?: string | null;
  date: string;
  time?: string | null;
  type: FollowUpType;
  notes?: string | null;
  status: FollowUpStatus;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lead?: {
    id: number;
    leadId: string;
    name: string;
    mobile: string;
    interestedCourse?: string | null;
    status: LeadStatus;
  } | null;
}

export interface TaskItem {
  id: number;
  leadId?: string | null;
  leadRelId?: number | null;
  assignedTo?: string | null;
  title: string;
  description?: string | null;
  priority: Priority;
  dueDate?: string | null;
  dueTime?: string | null;
  status: TaskStatus;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lead?: {
    id: number;
    leadId: string;
    name: string;
    mobile: string;
  } | null;
}
