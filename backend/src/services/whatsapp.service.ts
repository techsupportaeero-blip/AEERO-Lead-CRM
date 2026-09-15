import { prisma } from '../config/database.js';
import { sendOmtelTemplateMessage } from '../integrations/whatsapp/omtel.client.js';
import { getTemplateById, WHATSAPP_TEMPLATES } from '../integrations/whatsapp/templates.js';
import { ActivityService } from './activity.service.js';

export interface BulkSendResultItem {
  leadId: string;
  name: string;
  mobile: string;
  success: boolean;
  status: number;
  response: any;
}

// Delay between sends so a big batch doesn't slam the provider's rate limit
// (and risk the sender number getting throttled/flagged).
const SEND_DELAY_MS = 350;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function normalizeMobile(mobile: string): string {
  const digits = String(mobile || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  // Assume 10-digit numbers are Indian mobiles missing the country code.
  if (digits.length === 10) return `+91${digits}`;
  return digits.startsWith('+') ? digits : `+${digits}`;
}

// Omtel's error shape varies (Meta-relayed {errors:[{codeMsg,message}]},
// our own pre-send checks {error}, non-JSON {raw}, network failures) - pull
// out whatever's human-readable so the activity log actually explains WHY a
// send failed, not just that it did.
function extractFailureReason(response: any): string {
  if (!response) return 'Unknown error';
  if (Array.isArray(response.errors) && response.errors.length > 0) {
    const e = response.errors[0];
    return e.message || e.codeMsg || JSON.stringify(e);
  }
  if (response.error) return String(response.error);
  if (response.raw) return String(response.raw).slice(0, 200) || 'Empty response from provider';
  return JSON.stringify(response).slice(0, 200);
}

export class WhatsAppService {
  static listTemplates() {
    return WHATSAPP_TEMPLATES;
  }

  static async bulkSend(leadIds: string[], templateId: string, createdBy = 'Counselor'): Promise<BulkSendResultItem[]> {
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Unknown WhatsApp template: ${templateId}`);
    }

    const leads = await prisma.lead.findMany({
      where: { leadId: { in: leadIds } },
      select: { leadId: true, name: true, mobile: true }
    });

    const results: BulkSendResultItem[] = [];

    // Tag every send in this batch with the same timestamp so a "who got
    // this campaign" lookup can group them (e.g. filter Activities by type
    // WHATSAPP + this subject + around this time), without needing a new
    // DB table just to answer "who got it and who didn't".
    const batchLabel = `${template.name} (${new Date().toLocaleString('en-IN')})`;

    for (const lead of leads) {
      const mobile = normalizeMobile(lead.mobile);
      if (!mobile) {
        results.push({ leadId: lead.leadId, name: lead.name, mobile: lead.mobile, success: false, status: 0, response: { error: 'No valid mobile number on this lead.' } });
        try {
          await ActivityService.recordActivity(
            lead.leadId,
            {
              type: 'WHATSAPP',
              activityType: 'WhatsApp',
              subject: `WhatsApp template FAILED: ${batchLabel}`,
              description: `Bulk WhatsApp template "${template.name}" could not be sent: no valid mobile number on this lead.`,
              outcome: 'WhatsApp Message Failed: No valid mobile number'
            },
            createdBy
          );
        } catch {
          // Activity logging failure shouldn't fail the send result.
        }
        continue;
      }

      const variables = template.variableCount > 0 ? [lead.name || ''] : undefined;
      const result = await sendOmtelTemplateMessage(mobile, templateId, variables);

      results.push({ leadId: lead.leadId, name: lead.name, mobile, success: result.ok, status: result.status, response: result.data });

      try {
        if (result.ok) {
          await ActivityService.recordActivity(
            lead.leadId,
            {
              type: 'WHATSAPP',
              activityType: 'WhatsApp',
              subject: `WhatsApp template sent: ${batchLabel}`,
              description: `Bulk WhatsApp template "${template.name}" sent to ${mobile}.`,
              outcome: 'WhatsApp Message Sent'
            },
            createdBy
          );
        } else {
          const reason = extractFailureReason(result.data);
          await ActivityService.recordActivity(
            lead.leadId,
            {
              type: 'WHATSAPP',
              activityType: 'WhatsApp',
              subject: `WhatsApp template FAILED: ${batchLabel}`,
              description: `Bulk WhatsApp template "${template.name}" to ${mobile} failed: ${reason}`,
              outcome: `WhatsApp Message Failed: ${reason}`
            },
            createdBy
          );
        }
      } catch {
        // Activity logging failure shouldn't fail the send result.
      }

      await sleep(SEND_DELAY_MS);
    }

    return results;
  }
}
