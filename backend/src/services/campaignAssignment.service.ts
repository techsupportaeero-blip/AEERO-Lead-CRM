import { prisma } from '../config/database.js';

export class CampaignAssignmentService {
  static async listAssignments() {
    return prisma.campaignAssignment.findMany({ orderBy: { campaignName: 'asc' } });
  }

  static async getAssignment(campaignName: string): Promise<string | null> {
    if (!campaignName) return null;
    const row = await prisma.campaignAssignment.findUnique({ where: { campaignName } });
    return row?.ownerId || null;
  }

  // Sets (or updates) which counselor owns a campaign going forward, and
  // optionally moves every existing lead already tagged with that campaign
  // over to them too - "assign the whole campaign", not just future leads.
  static async setAssignment(campaignName: string, ownerId: string, assignedBy: string, reassignExisting: boolean) {
    const assignment = await prisma.campaignAssignment.upsert({
      where: { campaignName },
      update: { ownerId, assignedBy },
      create: { campaignName, ownerId, assignedBy }
    });

    let reassignedCount = 0;
    if (reassignExisting) {
      const result = await prisma.lead.updateMany({
        where: { campaign: campaignName },
        data: { ownerId }
      });
      reassignedCount = result.count;
    }

    return { assignment, reassignedCount };
  }

  static async removeAssignment(campaignName: string) {
    await prisma.campaignAssignment.delete({ where: { campaignName } });
  }
}
