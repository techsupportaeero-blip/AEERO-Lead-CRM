import { prisma } from '../config/database.js';

/**
 * Generates the next sequential Lead ID (e.g. LD-000001, LD-000002).
 * Uses atomic transaction on LeadCounter model to guarantee uniqueness in high-concurrency environments.
 */
export async function generateNextLeadId(): Promise<string> {
  return await prisma.$transaction(async (tx: any) => {
    // 1. Ensure counter record exists
    let counter = await tx.leadCounter.findUnique({
      where: { name: 'lead_seq' }
    });

    if (!counter) {
      // Find the highest existing lead numeric ID
      const latestLead = await tx.lead.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true, leadId: true }
      });

      let startVal = 0;
      if (latestLead?.leadId && latestLead.leadId.startsWith('LD-')) {
        const parsed = parseInt(latestLead.leadId.replace('LD-', ''), 10);
        if (!isNaN(parsed)) {
          startVal = Math.max(parsed, latestLead.id);
        }
      } else if (latestLead?.id) {
        startVal = latestLead.id;
      }

      counter = await tx.leadCounter.create({
        data: {
          name: 'lead_seq',
          lastNumber: startVal
        }
      });
    }

    // 2. Increment counter atomically
    const updated = await tx.leadCounter.update({
      where: { name: 'lead_seq' },
      data: {
        lastNumber: {
          increment: 1
        }
      }
    });

    const paddedNumber = String(updated.lastNumber).padStart(6, '0');
    return `LD-${paddedNumber}`;
  });
}
