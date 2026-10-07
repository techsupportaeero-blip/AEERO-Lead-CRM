import { prisma } from '../config/database.js';

/**
 * Generates the next sequential Lead ID (e.g. LD-000001, LD-000002).
 * Uses atomic transaction on LeadCounter model to guarantee uniqueness in high-concurrency environments.
 * Retries a few times on transient failures (e.g. a transaction conflict
 * during a concurrent Google Sheets bulk sync) before giving up, so a
 * passing hiccup doesn't immediately fall back to a non-sequential ID.
 */
export async function generateNextLeadId(): Promise<string> {
  const MAX_ATTEMPTS = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await generateNextLeadIdOnce();
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 150 * attempt));
      }
    }
  }
  throw lastErr;
}

async function generateNextLeadIdOnce(): Promise<string> {
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
