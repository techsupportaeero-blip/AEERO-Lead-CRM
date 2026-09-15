/**
 * Client for Omtel MsgHub's "Single WhatsApp" API.
 *
 * Verified request shape (confirmed live against Omtel's own API docs +
 * a real test send on 2026-09-14):
 *   POST https://whatsapp.omtelmsghub.com/api/v1/whatsapp/single?api_key=<key>
 *   { "message_type": "text", "sender": "+91...", "to": "+91...", "template_id": "..." }
 *
 * Two things that are NOT obvious from the panel UI and will silently break
 * sends if gotten wrong:
 *  1. The API lives on `whatsapp.omtelmsghub.com`, a different subdomain
 *     from the dashboard (`panel.omtelmsghub.com`) - posting to the panel
 *     domain returns a misleading 405 (it only serves GET there).
 *  2. `template_id` must be Omtel's own template id (the "ID" column in
 *     Whatsapp Settings > Templates, e.g. "solar_webinar_f3bahbs7nawpv870"),
 *     NOT the Meta/WABA template id ("WABA ID" column, e.g.
 *     "753563377798566") - the WABA id returns TEMPLATE_NOT_APPROVED.
 *  3. `sender` must be a phone number connected to the SAME WABA account
 *     that owns the template (Whatsapp Settings > Phones vs > WABA), or the
 *     API returns HEADER_NOT_ALLOWED_ON_TEMPLATE ("different WABA accounts").
 *
 * NOTE: Omtel's docs don't show a field for passing the value of a template's
 * {{1}} variable (e.g. the "solar_webinar" template's recipient-name slot).
 * `variables` below is a best-effort guess (a plain array of positional
 * values, the common convention among similar WhatsApp BSP panels) and is
 * still UNVERIFIED - the one template confirmed working end-to-end so far
 * (the fire-safety carousel template) takes no variables.
 */

const OMTEL_ENDPOINT = 'https://whatsapp.omtelmsghub.com/api/v1/whatsapp/single';

export interface OmtelSendResult {
  ok: boolean;
  status: number;
  data: any;
}

function buildRequestBody(sender: string, to: string, templateId: string, variables?: string[]) {
  const body: Record<string, any> = {
    message_type: 'text',
    sender,
    to,
    template_id: templateId
  };
  if (variables && variables.length > 0) {
    // UNVERIFIED field name - see note above.
    body.variables = variables;
  }
  return body;
}

export async function sendOmtelTemplateMessage(
  to: string,
  templateId: string,
  variables?: string[]
): Promise<OmtelSendResult> {
  const apiKey = process.env.OMTEL_API_KEY;
  const sender = process.env.OMTEL_SENDER_NUMBER;

  if (!apiKey || !sender) {
    return {
      ok: false,
      status: 0,
      data: { error: 'OMTEL_API_KEY or OMTEL_SENDER_NUMBER is not configured on the server.' }
    };
  }

  const url = `${OMTEL_ENDPOINT}?api_key=${encodeURIComponent(apiKey)}`;
  const body = buildRequestBody(sender, to, templateId, variables);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return { ok: response.ok, status: response.status, data };
  } catch (err: any) {
    return { ok: false, status: 0, data: { error: err.message || 'Network error calling Omtel API' } };
  }
}
