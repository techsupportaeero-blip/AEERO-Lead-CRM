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
}
