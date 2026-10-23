import { prisma } from '../config/database.js';
import { ActivityType } from '../types/index.js';
import { LeadService } from './lead.service.js';
import { FollowupService } from './followup.service.js';

export class ActivityService {
  static normalizeActivityType(typeStr?: string | null): ActivityType {
    if (!typeStr) return ActivityType.CALL;
    const upper = String(typeStr).toUpperCase();
    if (Object.values(ActivityType).includes(upper as ActivityType)) {
      return upper as ActivityType;
    }
    if (upper.includes('CALL') || upper.includes('PHONE')) return ActivityType.CALL;
    if (upper.includes('WHATSAPP') || upper.includes('CHAT')) return ActivityType.WHATSAPP;
    if (upper.includes('EMAIL') || upper.includes('MAIL')) return ActivityType.EMAIL;
    if (upper.includes('SMS')) return ActivityType.SMS;
    if (upper.includes('MEETING')) return ActivityType.MEETING;
    if (upper.includes('NOTE')) return ActivityType.NOTE;
    return ActivityType.OTHER;
  }

  static async getActivities(leadIdentifier: string | number) {
    // Only leadId/id are used below - getLeadById() eagerly loads every
    // activity/followUp/task/payment/note the lead has, which is wasted work
    // here (and, under Neon's per-round-trip latency, a visible delay).
    const lead = await LeadService.getLeadLite(leadIdentifier);
    if (!lead) return [];

    return prisma.activity.findMany({
      where: {
        OR: [
          { leadId: lead.leadId },
          { leadRelId: lead.id }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Global activity feed (not scoped to one lead) - backs the Dashboard's
   * "Activity Distribution" drill-down, so it mirrors the same
   * prisma.activity query dashboard.service.ts uses to build that chart.
   */
  static async getAllActivities(filters: { type?: string; limit?: number } = {}) {
    const where: any = {};
    if (filters.type) {
      where.type = this.normalizeActivityType(filters.type);
    }

    return prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ? Number(filters.limit) : 200
    });
  }

  static async recordActivity(leadIdentifier: string | number, data: any, createdBy = 'Counselor', userId?: number) {
    // Same reasoning as getActivities() above - this is the "Save & Update
    // Lead" button's backing call (Call & Update Panel), so its latency is
    // directly what counselors feel as "save takes forever".
    const lead = await LeadService.getLeadLite(leadIdentifier);
    if (!lead) throw new Error(`Lead ${leadIdentifier} not found.`);

    const actType = this.normalizeActivityType(data.type || data.activityType);
    const duration = data.durationMinutes || data.duration || 5;

    const activity = await prisma.activity.create({
      data: {
        leadId: lead.leadId,
        leadRelId: lead.id,
        userId: userId || null,
        type: actType,
        activityType: data.activityType || 'Call',
        subject: data.subject || 'Counseling Call',
        description: data.description || data.remarks || data.additionalInformation || 'Call Data Entry',
        outcome: data.outcome || 'Call Activity',
        durationMinutes: Number(duration),
        remarks: data.remarks || null,
        additionalInformation: data.additionalInformation || null,
        participants: data.participants || null,
        attachmentUrl: data.attachmentUrl || null,
        createdBy: createdBy || 'Counselor'
      }
    });

    // The follow-up row and the status update are independent writes - run
    // them together instead of one after another, so this call only pays
    // for the SLOWER of the two Neon round trips, not their sum.
    await Promise.all([
      data.followUpDate
        ? prisma.followUp.create({
            data: {
              leadId: lead.leadId,
              leadRelId: lead.id,
              date: data.followUpDate,
              time: data.followUpTime || '10:00',
              type: FollowupService.normalizeType(data.followUpType),
              notes: data.remarks || 'Scheduled Callback',
              status: 'PENDING',
              createdBy: createdBy || 'Counselor'
            }
          })
        : Promise.resolve(null),
      (data.leadStatus && data.leadStatus !== lead.status)
        ? LeadService.updateLead(lead.id, { status: data.leadStatus }, createdBy)
        : Promise.resolve(null)
    ]);

    return activity;
  }
}
