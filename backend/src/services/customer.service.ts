import { prisma } from '../config/database.js';

export class CustomerService {
  static async getCustomers() {
    return prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createCustomer(data: any) {
    return prisma.customer.create({
      data: {
        leadId: data.leadId || null,
        name: data.name.trim(),
        email: data.email || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        city: data.city || null,
        state: data.state || null,
        notes: data.notes || null
      }
    });
  }

  // Called when a lead transitions into CONVERTED status. Idempotent - a
  // lead that's marked CONVERTED more than once (e.g. moved out and back in
  // on the Kanban board) won't create duplicate Customer rows.
  static async createFromLeadIfMissing(lead: {
    leadId: string;
    name: string;
    email?: string | null;
    mobile: string;
    whatsappNumber?: string | null;
    city?: string | null;
    state?: string | null;
    interestedCourse?: string | null;
  }) {
    const existing = await prisma.customer.findUnique({ where: { leadId: lead.leadId } });
    if (existing) return existing;

    return prisma.customer.create({
      data: {
        leadId: lead.leadId,
        name: lead.name,
        email: lead.email || null,
        phone: lead.mobile,
        whatsapp: lead.whatsappNumber || lead.mobile,
        city: lead.city || null,
        state: lead.state || null,
        notes: lead.interestedCourse ? `Converted from lead ${lead.leadId} - interested in: ${lead.interestedCourse}` : `Converted from lead ${lead.leadId}`
      }
    });
  }
}
