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

  /**
   * Admin-facing view of every lead's follow-up progress: which "stage"
   * (1st, 2nd, 3rd... follow-up) each lead is currently at, who's handling
   * it, and what the most recent one looked like. Stage number is just the
   * chronological position of a follow-up within that lead's own history -
   * no separate "stage" field needed on the FollowUp model itself.
   */
  static async getStageTracker() {
    const followups = await prisma.followUp.findMany({
      where: { leadRelId: { not: null } },
      orderBy: [{ leadRelId: 'asc' }, { date: 'asc' }, { time: 'asc' }, { id: 'asc' }],
      include: {
        lead: {
          select: { id: true, leadId: true, name: true, ownerId: true, status: true }
        }
      }
    });

    const byLead = new Map<number, typeof followups>();
    for (const f of followups) {
      if (!f.leadRelId) continue;
      const list = byLead.get(f.leadRelId) || [];
      list.push(f);
      byLead.set(f.leadRelId, list);
    }

    const tracker = [];
    for (const [, stages] of byLead) {
      const lead = stages[0].lead;
      if (!lead) continue;
      const latest = stages[stages.length - 1];
      tracker.push({
        leadRelId: lead.id,
        leadId: lead.leadId,
        leadName: lead.name,
        counselor: lead.ownerId,
        leadStatus: lead.status,
        totalStages: stages.length,
        currentStageNumber: stages.length,
        latestFollowup: {
          id: latest.id,
          date: latest.date,
          time: latest.time,
          type: latest.type,
          status: latest.status,
          notes: latest.notes
        },
        stages: stages.map((s, idx) => ({
          stageNumber: idx + 1,
          id: s.id,
          date: s.date,
          time: s.time,
          type: s.type,
          status: s.status,
          notes: s.notes
        }))
      });
    }

    // Leads with the most follow-up attempts (i.e. stuck the longest)
    // surface first - that's usually what an admin wants to check on.
    tracker.sort((a, b) => b.totalStages - a.totalStages);
    return tracker;
  }
}
