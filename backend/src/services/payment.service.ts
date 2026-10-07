import { prisma } from '../config/database.js';
import { AuditLogService } from './auditLog.service.js';

// "1 Year" -> 12, "18 Months" -> 18, "3 Months" -> 3, "3 Years" -> 36.
// Falls back to 12 months for anything unparseable, so the EMI cap always
// resolves to a sane number instead of silently allowing unlimited EMIs.
function parseDurationToMonths(duration?: string | null): number {
  if (!duration) return 12;
  const yearMatch = duration.match(/(\d+(?:\.\d+)?)\s*Year/i);
  if (yearMatch) return Math.round(parseFloat(yearMatch[1]) * 12);
  const monthMatch = duration.match(/(\d+(?:\.\d+)?)\s*Month/i);
  if (monthMatch) return Math.round(parseFloat(monthMatch[1]));
  return 12;
}

// Minimal lead lookup for payment operations - these only ever need
// id/leadId/interestedCourse/campaign, never the full lead record with every
// activity/follow-up/task/note eager-loaded (LeadService.getLeadById), which
// was making payment screens noticeably slow to open/save.
async function findLeadLite(leadIdentifier: string | number) {
  const idNum = Number(leadIdentifier);
  const isNumeric = !isNaN(idNum) && String(leadIdentifier).trim() === String(idNum);
  return prisma.lead.findFirst({
    where: isNumeric
      ? { OR: [{ id: idNum }, { leadId: String(leadIdentifier) }] }
      : { leadId: String(leadIdentifier) },
    select: { id: true, leadId: true, interestedCourse: true, campaign: true }
  });
}

export class PaymentService {
  static async getPayments(leadIdentifier: string | number) {
    const lead = await findLeadLite(leadIdentifier);
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
    const lead = await findLeadLite(leadIdentifier);
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
        emiInstallmentNumber: data.emiInstallmentNumber ? Number(data.emiInstallmentNumber) : null,
        emiTotalInstallments: data.emiTotalInstallments ? Number(data.emiTotalInstallments) : null,
        createdBy: createdBy || 'Counselor'
      }
    });

    // Auto record activity for payment
    const emiNote = payment.emiTotalInstallments
      ? ` (EMI ${payment.emiInstallmentNumber} of ${payment.emiTotalInstallments})`
      : '';
    await prisma.activity.create({
      data: {
        leadId: lead.leadId,
        leadRelId: lead.id,
        type: 'NOTE',
        activityType: 'Payment Received',
        subject: `Payment Recorded: ₹${amount.toLocaleString('en-IN')}${emiNote}`,
        description: `Payment of ₹${amount.toLocaleString('en-IN')} via ${payment.paymentMethod}${emiNote}. Ref: ${payment.referenceNo || 'N/A'}`,
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

  // Powers the Record Payment modal's course-fee / paid-so-far / due summary
  // and EMI cap. Matches the lead's course the same way the Dashboard's
  // revenue estimate used to (interestedCourse first, campaign as fallback) -
  // campaign and course are treated as the same identity in this CRM.
  static async getPaymentSummary(leadIdentifier: string | number) {
    const lead = await findLeadLite(leadIdentifier);
    if (!lead) throw new Error(`Lead ${leadIdentifier} not found.`);

    const [payments, courseByInterested] = await Promise.all([
      prisma.payment.findMany({
        where: { OR: [{ leadId: lead.leadId }, { leadRelId: lead.id }] },
        orderBy: { createdAt: 'asc' }
      }),
      lead.interestedCourse
        ? prisma.course.findFirst({ where: { name: { equals: String(lead.interestedCourse).trim(), mode: 'insensitive' } } })
        : Promise.resolve(null)
    ]);
    const paidSoFar = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    let course = courseByInterested;
    if (!course && lead.campaign) {
      course = await prisma.course.findFirst({
        where: { name: { equals: String(lead.campaign).trim(), mode: 'insensitive' } }
      });
    }

    const totalFee = course ? Number(course.price) : 0;
    const dueBalance = Math.max(totalFee - paidSoFar, 0);
    const durationMonths = parseDurationToMonths(course?.duration);
    // Short courses (<=6 months) get the full duration as their EMI cap -
    // reducing an already-short plan further leaves installments too tight
    // to be useful. Longer courses cap at ~2/3 of the duration, so the plan
    // can't stretch all the way to (or past) the course ending.
    const maxEmiInstallments = durationMonths <= 6
      ? Math.max(1, durationMonths)
      : Math.max(1, Math.round(durationMonths * (2 / 3)));

    return {
      courseName: course?.name || lead.interestedCourse || lead.campaign || null,
      totalFee,
      paidSoFar,
      dueBalance,
      paymentsCount: payments.length,
      payments: payments.map(p => ({
        id: p.id,
        amount: Number(p.amount),
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod,
        emiInstallmentNumber: p.emiInstallmentNumber,
        emiTotalInstallments: p.emiTotalInstallments
      })),
      maxEmiInstallments,
      durationMonths
    };
  }
}
