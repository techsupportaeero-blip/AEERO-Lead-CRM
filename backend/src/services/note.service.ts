import { prisma } from '../config/database.js';
import { LeadService } from './lead.service.js';

export class NoteService {
  static async getNotes(leadIdentifier: string | number) {
    const lead = await LeadService.getLeadById(leadIdentifier);
    if (!lead) return [];

    return prisma.note.findMany({
      where: {
        OR: [{ leadId: lead.leadId }, { leadRelId: lead.id }]
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
    });
  }

  static async addNote(leadIdentifier: string | number, data: any, createdBy = 'Counselor') {
    const lead = await LeadService.getLeadById(leadIdentifier);
    if (!lead) throw new Error(`Lead ${leadIdentifier} not found.`);

    return prisma.note.create({
      data: {
        leadId: lead.leadId,
        leadRelId: lead.id,
        content: data.content.trim(),
        isPinned: Boolean(data.isPinned),
        createdBy: createdBy || 'Counselor'
      }
    });
  }

  static async updateNote(id: number, data: any) {
    const updateData: any = {};
    if (data.content !== undefined) updateData.content = data.content;
    if (data.isPinned !== undefined) updateData.isPinned = Boolean(data.isPinned);

    return prisma.note.update({
      where: { id },
      data: updateData
    });
  }

  static async deleteNote(id: number) {
    return prisma.note.delete({
      where: { id }
    });
  }
}
