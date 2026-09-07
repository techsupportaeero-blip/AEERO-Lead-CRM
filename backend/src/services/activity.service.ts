import { prisma } from '../config/database.js';
import { ActivityType } from '../types/index.js';
import { LeadService } from './lead.service.js';

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
    const lead = await LeadService.getLeadById(leadIdentifier);
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

  static async recordActivity(leadIdentifier: string | number, data: any, createdBy = 'Counselor', userId?: number) {
    const lead = await LeadService.getLeadById(leadIdentifier);
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

    // If follow-up date is also provided in the call log modal
    if (data.followUpDate) {
      await prisma.followUp.create({
        data: {
          leadId: lead.leadId,
          leadRelId: lead.id,
          date: data.followUpDate,
          time: data.followUpTime || '10:00',
          type: 'CALL',
          notes: data.remarks || 'Scheduled Callback',
          status: 'PENDING',
          createdBy: createdBy || 'Counselor'
        }
      });
    }

    // If lead status update requested
    if (data.leadStatus && data.leadStatus !== lead.status) {
      await LeadService.updateLead(lead.id, { status: data.leadStatus }, createdBy);
    }

    return activity;
  }
}
