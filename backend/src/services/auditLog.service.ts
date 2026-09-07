import { prisma } from '../config/database.js';

export interface CreateAuditLogParams {
  userId?: number;
  userName?: string;
  leadId?: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditLogService {
  static async log(params: CreateAuditLogParams) {
    try {
      let leadRelId: number | undefined;

      if (params.leadId) {
        const lead = await prisma.lead.findUnique({
          where: { leadId: params.leadId },
          select: { id: true }
        });
        if (lead) leadRelId = lead.id;
      }

      return await prisma.auditLog.create({
        data: {
          userId: params.userId,
          userName: params.userName,
          leadId: params.leadId,
          leadRelId,
          action: params.action,
          oldValue: params.oldValue,
          newValue: params.newValue,
          details: params.details,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent
        }
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
      return null;
    }
  }

  static async getAuditLogs(limit = 100) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }
}
