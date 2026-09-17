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
  // Merges the manually-managed LeadSource catalog (name/type/category/cost)
  // with real counts pulled straight from the Lead table, so this page
  // reflects what's actually happening on All Leads instead of a static
  // list. Any Lead.source value with no matching catalog row still shows up
  // (isAutoDiscovered: true) so a source nobody bothered to catalog is never
  // silently invisible.
  static async getLeadSources() {
    const [catalog, leadCounts, convertedCounts] = await Promise.all([
      prisma.leadSource.findMany({ orderBy: { id: 'asc' } }),
      prisma.lead.groupBy({ by: ['source'], _count: { _all: true } }),
      prisma.lead.groupBy({ by: ['source'], where: { status: 'CONVERTED' }, _count: { _all: true } })
    ]);

    const totalBySource = new Map<string, number>();
    leadCounts.forEach(row => {
      const key = (row.source || 'Unknown').trim().toLowerCase();
      totalBySource.set(key, (totalBySource.get(key) || 0) + row._count._all);
    });

    const convertedBySource = new Map<string, number>();
    convertedCounts.forEach(row => {
      const key = (row.source || 'Unknown').trim().toLowerCase();
      convertedBySource.set(key, (convertedBySource.get(key) || 0) + row._count._all);
    });

    const withStats = (name: string) => {
      const key = name.trim().toLowerCase();
      const totalLeads = totalBySource.get(key) || 0;
      const convertedLeads = convertedBySource.get(key) || 0;
      return {
        totalLeads,
        convertedLeads,
        conversionRate: totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0
      };
    };

    const catalogNames = new Set(catalog.map(c => c.name.trim().toLowerCase()));

    const result = catalog.map(source => ({ ...source, isAutoDiscovered: false, ...withStats(source.name) }));

    // Any real Lead.source not represented in the catalog at all.
    for (const key of totalBySource.keys()) {
      if (catalogNames.has(key)) continue;
      const originalName = leadCounts.find(row => (row.source || 'Unknown').trim().toLowerCase() === key)?.source || 'Unknown';
      result.push({
        id: null as any,
        name: originalName,
        code: null,
        description: null,
        type: null,
        category: null,
        costPerLead: null,
        isActive: true,
        createdAt: null as any,
        updatedAt: null as any,
        isAutoDiscovered: true,
        ...withStats(originalName)
      });
    }

    return result.sort((a, b) => b.totalLeads - a.totalLeads);
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
