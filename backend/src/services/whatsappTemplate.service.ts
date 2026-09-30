import { prisma } from '../config/database.js';

export class WhatsAppTemplateService {
  // Only what actually gets sent - the picker in Bulk WhatsApp shouldn't
  // offer a template someone paused or hasn't finished setting up.
  static async getActiveTemplates() {
    return prisma.whatsAppTemplate.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' }
    });
  }

  // For the management page, which needs to show inactive ones too so
  // they can be re-enabled or edited.
  static async getAllTemplates() {
    return prisma.whatsAppTemplate.findMany({
      orderBy: { id: 'asc' }
    });
  }

  static async getTemplateById(templateId: string) {
    return prisma.whatsAppTemplate.findFirst({
      where: { templateId, isActive: true }
    });
  }

  static async createTemplate(data: any) {
    const templateId = String(data.templateId || '').trim();
    if (!templateId) {
      throw new Error('Template ID is required.');
    }
    const existing = await prisma.whatsAppTemplate.findUnique({ where: { templateId } });
    if (existing) {
      throw new Error(`A template with ID '${templateId}' already exists.`);
    }

    return prisma.whatsAppTemplate.create({
      data: {
        templateId,
        name: String(data.name || '').trim(),
        body: String(data.body || ''),
        variableCount: Number(data.variableCount) || 0,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
      }
    });
  }

  static async updateTemplate(id: number, data: any) {
    const updateData: any = {};
    if (data.templateId !== undefined) updateData.templateId = String(data.templateId).trim();
    if (data.name !== undefined) updateData.name = String(data.name).trim();
    if (data.body !== undefined) updateData.body = String(data.body);
    if (data.variableCount !== undefined) updateData.variableCount = Number(data.variableCount) || 0;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

    if (updateData.templateId) {
      const existing = await prisma.whatsAppTemplate.findFirst({
        where: { templateId: updateData.templateId, id: { not: id } }
      });
      if (existing) {
        throw new Error(`A template with ID '${updateData.templateId}' already exists.`);
      }
    }

    return prisma.whatsAppTemplate.update({
      where: { id },
      data: updateData
    });
  }

  static async deleteTemplate(id: number) {
    return prisma.whatsAppTemplate.delete({ where: { id } });
  }
}
