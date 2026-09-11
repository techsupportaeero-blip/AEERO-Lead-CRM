import { prisma } from '../config/database.js';
import { generateNextLeadId } from '../utils/generateLeadId.js';
import { getCounselorForCampaign } from '../utils/campaignAssignment.js';
import { AuditLogService } from './auditLog.service.js';
import { LeadStatus, Priority } from '../types/index.js';

export interface LeadFilterParams {
  search?: string;
  status?: string;
  source?: string;
  owner?: string;
  course?: string;
  campaign?: string;
  priority?: string;
  city?: string;
  tag?: string;
  onlyArchived?: boolean | string;
  includeArchived?: boolean | string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class LeadService {
  /**
   * Helper to normalize string status values into enum values
   */
  static normalizeStatus(statusStr?: string | null): LeadStatus {
    if (!statusStr) return LeadStatus.NEW;
    const upper = String(statusStr).toUpperCase().replace(/[-\s\/]/g, '_');
    if (Object.values(LeadStatus).includes(upper as LeadStatus)) {
      return upper as LeadStatus;
    }
    if (upper.includes('NEW')) return LeadStatus.NEW;
    if (upper.includes('NO_ANSWER')) return LeadStatus.NO_ANSWER;
    if (upper.includes('GIVEN_DETAILS') || upper.includes('DETAILS')) return LeadStatus.GIVEN_DETAILS;
    if (upper.includes('INTERESTED')) return LeadStatus.INTERESTED;
    if (upper.includes('FOLLOW')) return LeadStatus.FOLLOW_UP;
    if (upper.includes('CONVERTED') || upper.includes('WON')) return LeadStatus.CONVERTED;
    if (upper.includes('NOT_INTERESTED')) return LeadStatus.NOT_INTERESTED;
    if (upper.includes('LOST')) return LeadStatus.LOST;
    if (upper.includes('INVALID')) return LeadStatus.INVALID;
    return LeadStatus.NEW;
  }

  /**
   * Helper to normalize priority
   */
  static normalizePriority(priorityStr?: string | null): Priority {
    if (!priorityStr) return Priority.MEDIUM;
    const upper = String(priorityStr).toUpperCase();
    if (Object.values(Priority).includes(upper as Priority)) {
      return upper as Priority;
    }
    return Priority.MEDIUM;
  }

  /**
   * Check for duplicate mobile or email
   */
  static async checkDuplicate(mobile?: string | null, email?: string | null, excludeId?: string | number | null) {
    const conditions: Array<Record<string, any>> = [];

    const cleanMobile = mobile ? String(mobile).replace(/[^\d+]/g, '').trim() : '';
    if (cleanMobile) {
      conditions.push({ mobile: { contains: cleanMobile } });
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    if (cleanEmail) {
      conditions.push({ email: { equals: cleanEmail } });
    }

    if (conditions.length === 0) return null;

    const where: Record<string, any> = {
      OR: conditions
    };

    if (excludeId) {
      if (typeof excludeId === 'number' || !isNaN(Number(excludeId))) {
        where.NOT = { id: Number(excludeId) };
      } else {
        where.NOT = { leadId: String(excludeId) };
      }
    }

    const existingLead = await prisma.lead.findFirst({
      where,
      select: {
        id: true,
        leadId: true,
        name: true,
        mobile: true,
        email: true,
        status: true,
        createdAt: true
      }
    });

    if (!existingLead) return null;

    const matchedField = cleanMobile && existingLead.mobile?.includes(cleanMobile) ? 'mobile' : 'email';
    const matchedValue = matchedField === 'mobile' ? existingLead.mobile : existingLead.email;

    return {
      match: existingLead,
      field: matchedField,
      value: matchedValue
    };
  }

  /**
   * Auto-assign counselor. A campaign is routed to one consistent counselor
   * (getCounselorForCampaign); leads with no campaign fall back to
   * course-based routing, then round-robin across active counselors.
   */
  static async getNextAutoAssignedCounselor(course?: string, campaign?: string): Promise<string> {
    if (course) {
      const c = course.toLowerCase();
      // Mapping logic based on frontend COURSE_TO_COUNSELOR_MAP
      if (c.includes('industrial safety') || c.includes('sub fire')) {
        return 'MS. INDU';
      }
      if (c.includes('fireman') || c.includes('diploma in sanitary')) {
        return 'MS. AYESHA';
      }
      if (c.includes('health sanitary') || c.includes('msme')) {
        return 'MS. PRITI';
      }
    }

    const activeUsers = await prisma.user.findMany({
      where: { isActive: true, role: { in: ['LEAD_FINDER', 'MANAGER'] } },
      select: { name: true },
      orderBy: { id: 'asc' }
    });
    const counselors = activeUsers.length > 0
      ? activeUsers.map(u => u.name)
      : ['MS. INDU', 'MS. AYESHA', 'MS. PRITI'];

    const campaignCounselor = getCounselorForCampaign(campaign, counselors);
    if (campaignCounselor) return campaignCounselor;

    // Fallback Round Robin when there's no campaign to key off of
    const leadCount = await prisma.lead.count();
    return counselors[leadCount % counselors.length];
  }

  /**
   * Create a new Lead (CRM Authenticated or Public Webhook)
   */
  static async createLead(
    data: any,
    createdBy = 'Counselor',
    userContext?: { userId?: number; userName?: string; ipAddress?: string; userAgent?: string }
  ) {
    // 1. Duplicate check unless bypassed
    if (!data.allowDuplicate) {
      const dup = await this.checkDuplicate(data.mobile, data.email);
      if (dup) {
        const fieldName = dup.field === 'email' ? 'Email Address' : 'Mobile Number';
        const error: any = new Error(
          `Duplicate Lead Found! ${fieldName} "${dup.value}" is already registered to "${dup.match.name}" (Lead ID: ${dup.match.leadId}).`
        );
        error.code = 'DUPLICATE_LEAD';
        error.isDuplicate = true;
        error.duplicateField = fieldName;
        error.duplicateValue = dup.value;
        error.existingLead = dup.match;
        throw error;
      }
    }

    // 2. Generate sequential Lead ID
    const leadId = await generateNextLeadId();

    // 3. Normalize status & priority
    const status = this.normalizeStatus(data.status);
    const priority = this.normalizePriority(data.priority);

    // 4. Determine owner
    let ownerId = data.ownerId;
    if (!ownerId || ownerId.trim() === '') {
      ownerId = await this.getNextAutoAssignedCounselor(data.interestedCourse || data.qualification, data.campaign);
    }

    // 5. Serialize tags
    let tagsStr: string = '[]';
    if (Array.isArray(data.tags)) {
      tagsStr = JSON.stringify(data.tags);
    } else if (typeof data.tags === 'string') {
      tagsStr = data.tags;
    }

    const newLead = await prisma.lead.create({
      data: {
        leadId,
        name: data.name.trim(),
        mobile: data.mobile.trim(),
        whatsappNumber: data.whatsappNumber || data.mobile.trim(),
        email: data.email ? data.email.trim().toLowerCase() : null,
        city: data.city || null,
        state: data.state || null,
        age: data.age ? Number(data.age) : null,
        qualification: data.qualification || null,
        interestedCourse: data.interestedCourse || null,
        preferredStudyMode: data.preferredStudyMode || 'Offline',
        requirement: data.requirement || null,
        remarks: data.remarks || null,
        ownerId,
        status,
        priority,
        tags: tagsStr,
        source: data.source || 'Website',
        sourceId: data.sourceId || null,
        platform: data.platform || null,
        campaign: data.campaign || null,
        campaignId: data.campaignId || null,
        adSet: data.adSet || null,
        adSetId: data.adSetId || null,
        ad: data.ad || null,
        adId: data.adId || null,
        formId: data.formId || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmContent: data.utmContent || null,
        utmTerm: data.utmTerm || null,
        gclid: data.gclid || null,
        fbclid: data.fbclid || null,
        landingPage: data.landingPage || null,
        externalLeadId: data.externalLeadId || null,
        externalSource: data.externalSource || null,
        createdBy
      }
    });

    // 6. Record Initial Activity
    await prisma.activity.create({
      data: {
        leadId: newLead.leadId,
        leadRelId: newLead.id,
        type: 'NOTE',
        activityType: 'Lead Created',
        subject: createdBy === 'Website API' ? 'Website Form Submission' : 'Manual Lead Entry',
        description: `Lead created under source: ${newLead.source || 'Direct'}`,
        outcome: 'Created',
        createdBy
      }
    });

    // 7. Audit log
    await AuditLogService.log({
      userId: userContext?.userId,
      userName: userContext?.userName || createdBy,
      leadId: newLead.leadId,
      action: 'LEAD_CREATED',
      newValue: JSON.stringify({
        name: newLead.name,
        mobile: newLead.mobile,
        source: newLead.source,
        status: newLead.status
      }),
      details: `Lead ${newLead.leadId} created by ${createdBy}`,
      ipAddress: userContext?.ipAddress,
      userAgent: userContext?.userAgent
    });

    return newLead;
  }

  /**
   * Get filtered leads list
   */
  static async getLeads(params: LeadFilterParams = {}) {
    const where: Record<string, any> = {};

    // 1. Archive filter
    const isOnlyArchived = params.onlyArchived === true || params.onlyArchived === 'true';
    const isIncludeArchived = params.includeArchived === true || params.includeArchived === 'true';

    if (isOnlyArchived) {
      where.isArchived = true;
    } else if (!isIncludeArchived) {
      where.isArchived = false;
    }

    // 2. Status filter
    if (params.status && params.status !== 'All' && params.status !== 'all') {
      where.status = this.normalizeStatus(params.status);
    }

    // 3. Priority filter
    if (params.priority && params.priority !== 'All' && params.priority !== 'all') {
      where.priority = this.normalizePriority(params.priority);
    }

    // 4. Source filter
    if (params.source && params.source !== 'All' && params.source !== 'all') {
      where.source = { equals: params.source, mode: 'insensitive' };
    }

    // 4b. Campaign filter (campaign names come from Meta Ads / Google Sheets,
    // not a fixed enum, so this matches whatever campaign strings exist)
    if (params.campaign && params.campaign !== 'All' && params.campaign !== 'all') {
      where.campaign = { equals: params.campaign, mode: 'insensitive' };
    }

    // 5. Owner / Counselor filter (case-insensitive: counselor names come from
    // multiple places - Users table, sheet ingestion, manual entry - and must
    // still match even if casing/spacing drifts between them)
    if (params.owner && params.owner !== 'All' && params.owner !== 'all') {
      where.ownerId = { equals: params.owner, mode: 'insensitive' };
    }

    // 6. Course filter
    if (params.course && params.course !== 'All' && params.course !== 'all') {
      where.interestedCourse = { contains: params.course };
    }

    // 7. City filter
    if (params.city) {
      where.city = { contains: params.city };
    }

    // 8. Tag filter
    if (params.tag) {
      where.tags = { contains: params.tag };
    }

    // 9. Search filter across multiple fields
    if (params.search && params.search.trim() !== '') {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { leadId: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { interestedCourse: { contains: q, mode: 'insensitive' } },
        { remarks: { contains: q, mode: 'insensitive' } }
      ];
    }

    // 10. Date range filter
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) {
        where.createdAt.gte = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        const endDate = new Date(params.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const orderBy: Record<string, any> = {};
    if (params.sortBy) {
      orderBy[params.sortBy] = params.sortOrder || 'desc';
    } else {
      orderBy.id = 'desc';
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy,
      include: {
        payments: true
      }
    });

    return leads;
  }

  /**
   * Get single lead by ID or LeadId (e.g. 1 or LD-000001)
   */
  static async getLeadById(identifier: string | number) {
    const idNum = Number(identifier);
    const isNumeric = !isNaN(idNum) && String(identifier).trim() === String(idNum);

    const lead = await prisma.lead.findFirst({
      where: isNumeric
        ? { OR: [{ id: idNum }, { leadId: String(identifier) }] }
        : { leadId: String(identifier) },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' }
        },
        followUps: {
          orderBy: { createdAt: 'desc' }
        },
        tasks: {
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        notes: {
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
        }
      }
    });

    return lead;
  }

  /**
   * Update lead
   */
  static async updateLead(
    identifier: string | number,
    updateData: any,
    updatedBy = 'Counselor',
    userContext?: { userId?: number; userName?: string; ipAddress?: string; userAgent?: string }
  ) {
    const existing = await this.getLeadById(identifier);
    if (!existing) {
      throw new Error(`Lead ${identifier} not found.`);
    }

    const data: Record<string, any> = {};

    if (updateData.name !== undefined) data.name = updateData.name.trim();
    if (updateData.mobile !== undefined) data.mobile = updateData.mobile.trim();
    if (updateData.whatsappNumber !== undefined) data.whatsappNumber = updateData.whatsappNumber;
    if (updateData.email !== undefined) data.email = updateData.email ? updateData.email.trim().toLowerCase() : null;
    if (updateData.city !== undefined) data.city = updateData.city;
    if (updateData.state !== undefined) data.state = updateData.state;
    if (updateData.age !== undefined) data.age = updateData.age ? Number(updateData.age) : null;
    if (updateData.qualification !== undefined) data.qualification = updateData.qualification;
    if (updateData.interestedCourse !== undefined) data.interestedCourse = updateData.interestedCourse;
    if (updateData.preferredStudyMode !== undefined) data.preferredStudyMode = updateData.preferredStudyMode;
    if (updateData.requirement !== undefined) data.requirement = updateData.requirement;
    if (updateData.remarks !== undefined) data.remarks = updateData.remarks;
    if (updateData.ownerId !== undefined) data.ownerId = updateData.ownerId;
    if (updateData.source !== undefined) data.source = updateData.source;
    if (updateData.platform !== undefined) data.platform = updateData.platform;
    if (updateData.campaign !== undefined) data.campaign = updateData.campaign;
    if (updateData.isArchived !== undefined) data.isArchived = Boolean(updateData.isArchived);

    if (updateData.status !== undefined) {
      data.status = this.normalizeStatus(updateData.status);
    }
    if (updateData.priority !== undefined) {
      data.priority = this.normalizePriority(updateData.priority);
    }
    if (updateData.tags !== undefined) {
      data.tags = Array.isArray(updateData.tags) ? JSON.stringify(updateData.tags) : updateData.tags;
    }

    const updated = await prisma.lead.update({
      where: { id: existing.id },
      data
    });

    // Record status change activity if changed
    if (updateData.status && data.status !== existing.status) {
      await prisma.activity.create({
        data: {
          leadId: existing.leadId,
          leadRelId: existing.id,
          type: 'NOTE',
          activityType: 'Status Change',
          subject: 'Lead Status Updated',
          description: `Status changed from '${existing.status}' to '${data.status}'`,
          outcome: data.status as string,
          createdBy: updatedBy
        }
      });
    }

    // Audit log
    await AuditLogService.log({
      userId: userContext?.userId,
      userName: userContext?.userName || updatedBy,
      leadId: existing.leadId,
      action: 'LEAD_UPDATED',
      oldValue: JSON.stringify({ status: existing.status, priority: existing.priority, ownerId: existing.ownerId }),
      newValue: JSON.stringify(data),
      details: `Lead ${existing.leadId} updated by ${updatedBy}`,
      ipAddress: userContext?.ipAddress,
      userAgent: userContext?.userAgent
    });

    return updated;
  }

  /**
   * Fast status update (e.g. Kanban drag and drop)
   */
  static async updateLeadStatus(
    identifier: string | number,
    statusStr: string,
    updatedBy = 'Counselor',
    userContext?: { userId?: number; userName?: string }
  ) {
    const existing = await this.getLeadById(identifier);
    if (!existing) throw new Error(`Lead ${identifier} not found.`);

    const newStatus = this.normalizeStatus(statusStr);

    const updated = await prisma.lead.update({
      where: { id: existing.id },
      data: { status: newStatus }
    });

    await prisma.activity.create({
      data: {
        leadId: existing.leadId,
        leadRelId: existing.id,
        type: 'NOTE',
        activityType: 'Kanban Stage Change',
        subject: 'Pipeline Stage Moved',
        description: `Lead moved to stage '${newStatus}'`,
        outcome: newStatus,
        createdBy: updatedBy
      }
    });

    await AuditLogService.log({
      userId: userContext?.userId,
      userName: userContext?.userName || updatedBy,
      leadId: existing.leadId,
      action: 'STATUS_CHANGED',
      oldValue: existing.status,
      newValue: newStatus,
      details: `Status changed from ${existing.status} to ${newStatus}`
    });

    return updated;
  }

  /**
   * Archive lead (Soft delete)
   */
  static async archiveLead(identifier: string | number, currentUser = 'System') {
    const existing = await this.getLeadById(identifier);
    if (!existing) throw new Error(`Lead ${identifier} not found.`);

    const updated = await prisma.lead.update({
      where: { id: existing.id },
      data: { isArchived: true }
    });

    await AuditLogService.log({
      userName: currentUser,
      leadId: existing.leadId,
      action: 'LEAD_ARCHIVED',
      details: `Lead ${existing.leadId} archived by ${currentUser}`
    });

    return updated;
  }

  /**
   * Unarchive / Restore lead (Admin Only)
   */
  static async unarchiveLead(identifier: string | number, currentUser = 'Admin') {
    const existing = await this.getLeadById(identifier);
    if (!existing) throw new Error(`Lead ${identifier} not found.`);

    const updated = await prisma.lead.update({
      where: { id: existing.id },
      data: { isArchived: false }
    });

    await AuditLogService.log({
      userName: currentUser,
      leadId: existing.leadId,
      action: 'LEAD_RESTORED',
      details: `Lead ${existing.leadId} restored by ${currentUser}`
    });

    return updated;
  }

  /**
   * Permanent Delete lead (Admin Only)
   */
  static async deleteLead(identifier: string | number, currentUser = 'Admin') {
    const existing = await this.getLeadById(identifier);
    if (!existing) throw new Error(`Lead ${identifier} not found.`);

    await prisma.lead.delete({
      where: { id: existing.id }
    });

    await AuditLogService.log({
      userName: currentUser,
      leadId: existing.leadId,
      action: 'LEAD_DELETED',
      details: `Lead ${existing.leadId} permanently deleted by ${currentUser}`
    });

    return true;
  }

  /**
   * Cheap total-active-leads count (single COUNT query) for badges/UI chrome
   * that only needs the number, not the full stats aggregate.
   */
  static async getLeadsCount() {
    return prisma.lead.count({ where: { isArchived: false } });
  }

  /**
   * Bulk archive every active (non-archived) lead in one go (Admin Only).
   * Powers the "Clear All" action on the Active Leads view.
   */
  static async bulkArchiveActive(currentUser = 'Admin') {
    const result = await prisma.lead.updateMany({
      where: { isArchived: false },
      data: { isArchived: true }
    });

    await AuditLogService.log({
      userName: currentUser,
      leadId: 'BULK',
      action: 'LEAD_BULK_ARCHIVED',
      details: `${result.count} active lead(s) bulk-archived by ${currentUser}`
    });

    return result.count;
  }

  /**
   * Permanently delete every archived lead in one go (Admin Only, irreversible).
   * Powers the "Clear All" action on the Archived Leads view.
   */
  static async bulkDeleteArchived(currentUser = 'Admin') {
    const count = await prisma.lead.count({ where: { isArchived: true } });

    await prisma.lead.deleteMany({ where: { isArchived: true } });

    await AuditLogService.log({
      userName: currentUser,
      leadId: 'BULK',
      action: 'LEAD_BULK_DELETED',
      details: `${count} archived lead(s) permanently deleted by ${currentUser}`
    });

    return count;
  }
}
