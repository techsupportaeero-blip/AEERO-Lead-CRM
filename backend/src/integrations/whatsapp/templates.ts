/**
 * Registry of Meta-approved WhatsApp templates available through Omtel.
 * Add new entries here as more templates get approved - the bulk-send UI
 * reads this list to populate its template picker.
 */

export interface WhatsAppTemplate {
  templateId: string;
  name: string;
  /** Raw approved template text, with {{1}}, {{2}}, ... placeholders. */
  body: string;
  /** How many positional variables the template expects. */
  variableCount: number;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    // Active/Approved. Correct WABA (929716382908637, matches the connected
    // sender phone +919310413724) - fully working, confirmed with a real
    // send on 2026-09-15. Body text edited on Omtel's side to this shorter
    // urgency message (was the longer webinar-confirmation text before).
    templateId: 'crm_leads_ad3zcswlccewknlj',
    name: 'crm_leads',
    body: 'Hello {{1}}, hurry up limited seats are left',
    variableCount: 1
  },
  {
    // Submitted 2026-09-15, still In_review as of this commit - won't send
    // until Meta approves it. IS under the working WABA (929716382908637,
    // matches the connected sender phone +919310413724) though, so once
    // approved it'll be sendable immediately, no phone-connect step needed.
    templateId: 'lead_crm_aeero_1234_0xvvsfhywcs3c621',
    name: 'lead_crm_aeero_1234',
    body: 'hlo {{1}} this is a test msg',
    variableCount: 1
  },
  {
    // Now Active/Approved (was Draft as of the last check) - correct WABA
    // (929716382908637, matches the connected phone). Confirmed deliverable
    // with a real send on 2026-09-15. NOTE: like every template here, the
    // {{1}} slot still renders as the literal text "bodyvar0" instead of
    // the lead's name, because the correct JSON field for passing template
    // variables to Omtel is still unconfirmed (see omtel.client.ts) - this
    // is an Omtel API-wide issue, not specific to this template.
    templateId: 'duplicate_crm_leads_ad3zcswlccewknlj',
    name: 'duplicate_crm_leads',
    body: 'Hello {{1}}, Your seat for the FREE Solar Career Webinar is confirmed! 🚀\n📅 Date: 14th September\n⏰ Time: 2:00 PM - 4:00 PM\n📍 Venue: Live on Google Meet\nJoining link will be shared soon!',
    variableCount: 1
  }
];

export function getTemplateById(templateId: string): WhatsAppTemplate | undefined {
  return WHATSAPP_TEMPLATES.find(t => t.templateId === templateId);
}
