import { prisma } from '../config/database.js';
import { FollowUpType, FollowUpStatus } from '../types/index.js';
import { LeadService } from './lead.service.js';

export class FollowupService {
  static normalizeType(typeStr?: string | null): FollowUpType {
    if (!typeStr) return FollowUpType.CALL;
    const upper = String(typeStr).toUpperCase();
    if (Object.values(FollowUpType).includes(upper as FollowUpType)) {
      return upper as FollowUpType;
    }
    if (upper.includes('CALL')) return FollowUpType.CALL;
    if (upper.includes('WHATSAPP')) return FollowUpType.WHATSAPP;
    if (upper.includes('EMAIL')) return FollowUpType.EMAIL;
    if (upper.includes('MEETING')) return FollowUpType.MEETING;
    return FollowUpType.OTHER;
  }

  static normalizeStatus(statusStr?: string | null): FollowUpStatus {
    if (!statusStr) return FollowUpStatus.PENDING;
    const upper = String(statusStr).toUpperCase();
    if (Object.values(FollowUpStatus).includes(upper as FollowUpStatus)) {
      return upper as FollowUpStatus;
    }
    return FollowUpStatus.PENDING;
  }

  static async getFollowups(leadIdentifier?: string | number, filters: any = {}) {
    const where: any = {};

    if (leadIdentifier) {
      const lead = await LeadService.getLeadById(leadIdentifier);
      if (lead) {
        where.OR = [{ leadId: lead.leadId }, { leadRelId: lead.id }];
      } else {
        where.leadId = String(leadIdentifier);
      }
    }

    if (filters.status) {
      where.status = this.normalizeStatus(filters.status);
    }

    if (filters.date) {
      where.date = filters.date;
    }

    return prisma.followUp.findMany({
      where,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      include: {
        lead: {
          select: {
            id: true,
            leadId: true,
            name: true,
            mobile: true,
            interestedCourse: true,
            status: true
          }
        }
      }
    });
  }

  static async addFollowup(leadIdentifier: string | number, data: any, createdBy = 'Counselor') {
    const lead = await LeadService.getLeadById(leadIdentifier);
    if (!lead) throw new Error(`Lead ${leadIdentifier} not found.`);

    const type = this.normalizeType(data.type);
    const status = this.normalizeStatus(data.status);

    return prisma.followUp.create({
      data: {
        leadId: lead.leadId,
        leadRelId: lead.id,
        assignedTo: data.assignedTo || lead.ownerId || createdBy,
        date: data.date,
        time: data.time || '10:00',
        type,
        notes: data.notes || '',
        status,
        createdBy: createdBy || 'Counselor'
      }
    });
  }

  static async updateFollowup(id: number, data: any) {
    const updateData: any = {};
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.time !== undefined) updateData.time = data.time;
    if (data.type !== undefined) updateData.type = this.normalizeType(data.type);
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = this.normalizeStatus(data.status);

    return prisma.followUp.update({
      where: { id },
      data: updateData
    });
  }

  static async deleteFollowup(id: number) {
    return prisma.followUp.delete({
      where: { id }
    });
  }
}
