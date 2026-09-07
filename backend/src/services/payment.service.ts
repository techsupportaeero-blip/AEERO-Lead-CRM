import { prisma } from '../config/database.js';
import { LeadService } from './lead.service.js';
import { AuditLogService } from './auditLog.service.js';

export class PaymentService {
  static async getPayments(leadIdentifier: string | number) {
    const lead = await LeadService.getLeadById(leadIdentifier);
    if (!lead) return [];

    return prisma.payment.findMany({
      where: {
        OR: [{ leadId: lead.leadId }, { leadRelId: lead.id }]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async recordPayment(
    leadIdentifier: string | number,
    data: any,
    createdBy = 'Counselor',
    userContext?: { userId?: number; userName?: string }
  ) {
    const lead = await LeadService.getLeadById(leadIdentifier);
    if (!lead) throw new Error(`Lead ${leadIdentifier} not found.`);

    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Valid payment amount is required.');
    }

    const payment = await prisma.payment.create({
      data: {
        leadId: lead.leadId,
        leadRelId: lead.id,
        amount,
        paymentMethod: data.paymentMethod || 'Bank Transfer',
        referenceNo: data.referenceNo || null,
        notes: data.notes || null,
        paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
        createdBy: createdBy || 'Counselor'
      }
    });

    // Auto record activity for payment
    await prisma.activity.create({
      data: {
        leadId: lead.leadId,
        leadRelId: lead.id,
        type: 'NOTE',
        activityType: 'Payment Received',
        subject: `Payment Recorded: ₹${amount.toLocaleString('en-IN')}`,
        description: `Payment of ₹${amount.toLocaleString('en-IN')} via ${payment.paymentMethod}. Ref: ${payment.referenceNo || 'N/A'}`,
        outcome: 'Payment Done',
        createdBy
      }
    });

    // Audit log
    await AuditLogService.log({
      userId: userContext?.userId,
      userName: userContext?.userName || createdBy,
      leadId: lead.leadId,
      action: 'PAYMENT_RECORDED',
      newValue: JSON.stringify({ amount, paymentMethod: payment.paymentMethod, referenceNo: payment.referenceNo }),
      details: `Payment ₹${amount} recorded for lead ${lead.leadId}`
    });

    return payment;
  }
}
