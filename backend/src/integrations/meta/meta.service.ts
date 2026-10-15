import crypto from 'crypto';
import { MetaLeadDetails, NormalizedIntegrationLead } from './meta.types.js';
import { LeadService } from '../../services/lead.service.js';
import { logger } from '../../utils/logger.js';

const GRAPH_API_VERSION = 'v21.0';

export class MetaIntegrationService {
  /**
   * Verifies the `X-Hub-Signature-256` header Meta sends on every webhook
   * POST, so the endpoint rejects forged requests (anyone who knows the URL
   * could otherwise POST fake leads straight into the CRM). Needs the RAW
   * request body bytes, not the re-serialized parsed JSON - Meta signs the
   * exact bytes it sent, and JSON.stringify(parsed) isn't guaranteed to
   * reproduce them byte-for-byte (key order, spacing, etc.).
   */
  static verifyWebhookSignature(rawBody: Buffer | undefined, signatureHeader: string | undefined, appSecret: string | undefined): boolean {
    if (!rawBody || !signatureHeader || !appSecret) return false;

    const prefix = 'sha256=';
    if (!signatureHeader.startsWith(prefix)) return false;

    const expectedHex = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
    const providedHex = signatureHeader.slice(prefix.length);

    try {
      return crypto.timingSafeEqual(Buffer.from(expectedHex, 'hex'), Buffer.from(providedHex, 'hex'));
    } catch {
      // Lengths differed (malformed header) - timingSafeEqual throws rather
      // than returning false for that case.
      return false;
    }
  }

  /**
   * Fetches the full lead answers from Meta's Graph API using the
   * leadgen_id the webhook event gives us - the webhook payload itself only
   * ever contains IDs, never the actual form answers.
   */
  static async fetchLeadFromGraphApi(leadgenId: string, pageAccessToken: string | undefined): Promise<MetaLeadDetails | null> {
    if (!pageAccessToken) {
      logger.error('[Meta Integration] META_PAGE_ACCESS_TOKEN is not configured - cannot fetch lead details.');
      return null;
    }

    try {
      // Explicit `fields` list - the _name variants (campaign_name, ad_name,
      // adset_name) aren't always included unless asked for by name.
      const fields = 'id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,field_data';
      const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${leadgenId}?fields=${fields}&access_token=${encodeURIComponent(pageAccessToken)}`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (!response.ok || data.error) {
        logger.error(`[Meta Integration] Graph API error for lead ${leadgenId}: ${JSON.stringify(data.error || data)}`);
        return null;
      }

      return data as MetaLeadDetails;
    } catch (err: any) {
      logger.error(`[Meta Integration] Failed to fetch lead ${leadgenId} from Graph API: ${err.message}`);
      return null;
    }
  }

  /**
   * Normalizes Meta field_data format into standard CRM lead schema. Mirrors
   * the alias/cleanup logic the Google Sheets bridge already uses
   * (google-apps-script.js / sync.js) so a lead looks the same in the CRM
   * regardless of which pipeline brought it in.
   */
  static normalizeMetaLead(metaLead: MetaLeadDetails): NormalizedIntegrationLead {
    let name = 'Meta Lead';
    let mobile = '';
    let email = '';
    let city = '';
    let state = '';
    let qualification = '';
    let requirement = '';
    let interestedCourse = '';

    (metaLead.field_data || []).forEach(field => {
      const key = field.name.toLowerCase().trim();
      const val = (field.values && field.values[0]) || '';
      if (!val) return;

      if (key.includes('full_name') || key === 'name') {
        name = val;
      } else if (key.includes('phone') || key.includes('mobile')) {
        mobile = val;
      } else if (key.includes('email')) {
        email = val;
      } else if (key.includes('city')) {
        city = val;
      } else if (key.includes('state')) {
        state = val;
      } else if (key.includes('qualification') || key.includes('education')) {
        qualification = val;
      } else if (key.includes('when_do_you_want') || key.includes('start')) {
        requirement = val;
      } else if (key.includes('course') || key.includes('program') || key.includes('training')) {
        interestedCourse = val;
      }
    });

    // Facebook occasionally fills a custom question's answer with its own
    // permission error instead of the real value - same cleanup the Sheets
    // bridge applies, so this never leaks into the CRM from either pipeline.
    const cleanPermissionError = (v: string) =>
      v && v.toLowerCase().includes('enough permission') ? 'No Permission' : v;

    return {
      name: cleanPermissionError(name) || 'Meta Lead',
      mobile: mobile.startsWith('p:') ? mobile.slice(2) : mobile,
      email: cleanPermissionError(email),
      city: cleanPermissionError(city),
      state: cleanPermissionError(state),
      qualification: cleanPermissionError(qualification) || undefined,
      requirement: cleanPermissionError(requirement) || undefined,
      interestedCourse: cleanPermissionError(interestedCourse) || undefined,
      source: 'Meta Ads',
      platform: 'Facebook / Instagram',
      campaign: metaLead.campaign_name,
      campaignId: metaLead.campaign_id,
      adSet: metaLead.adset_name,
      adSetId: metaLead.adset_id,
      ad: metaLead.ad_name,
      adId: metaLead.ad_id,
      formId: metaLead.form_id,
      externalLeadId: metaLead.id,
      externalSource: 'Meta_Lead_Ads'
    };
  }

  /**
   * Ingests a verified Meta lead into the CRM. Relies on LeadService's
   * existing mobile/email duplicate check plus the DB-level unique
   * constraint on externalLeadId (same protection the Sheets bridge uses)
   * to stay safe if Meta redelivers the same webhook event.
   */
  static async processIncomingLead(normalizedLead: NormalizedIntegrationLead) {
    return LeadService.createLead(
      {
        ...normalizedLead,
        tags: ['Meta Ads', 'Social Lead']
      },
      'Meta Webhook'
    );
  }
}
