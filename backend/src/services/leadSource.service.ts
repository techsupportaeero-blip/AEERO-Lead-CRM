import { prisma } from '../config/database.js';

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
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : data.active !== undefined ? Boolean(data.active) : true
      }
    });
  }

  static async updateLeadSource(id: number, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.code !== undefined) updateData.code = data.code;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    if (data.active !== undefined) updateData.isActive = Boolean(data.active);

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
