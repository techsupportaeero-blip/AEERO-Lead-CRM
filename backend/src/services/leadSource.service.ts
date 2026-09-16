import { prisma } from '../config/database.js';

// Accepts either an explicit boolean (isActive/active) or the UI's
// 'Active'/'Inactive' status string, so old and new callers both work.
function resolveIsActive(data: any): boolean | undefined {
  if (data.isActive !== undefined) return Boolean(data.isActive);
  if (data.active !== undefined) return Boolean(data.active);
  if (data.status !== undefined) return data.status === 'Active';
  return undefined;
}

export class LeadSourceService {
  static async getLeadSources() {
    return prisma.leadSource.findMany({
      orderBy: { id: 'asc' }
    });
  }

  static async createLeadSource(data: any) {
    const existing = await prisma.leadSource.findUnique({
      where: { name: data.name.trim() }
    });
    if (existing) {
      throw new Error(`Lead source '${data.name}' already exists.`);
    }

    return prisma.leadSource.create({
      data: {
        name: data.name.trim(),
        code: data.code || null,
        description: data.description || null,
        type: data.type || 'Online',
        category: data.category || 'Other',
        costPerLead: data.costPerLead || null,
        isActive: resolveIsActive(data) ?? true
      }
    });
  }

  static async updateLeadSource(id: number, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.costPerLead !== undefined) updateData.costPerLead = data.costPerLead;
    const isActive = resolveIsActive(data);
    if (isActive !== undefined) updateData.isActive = isActive;

    return prisma.leadSource.update({
      where: { id },
      data: updateData
    });
  }

  static async deleteLeadSource(id: number) {
    return prisma.leadSource.delete({
      where: { id }
    });
  }
}
