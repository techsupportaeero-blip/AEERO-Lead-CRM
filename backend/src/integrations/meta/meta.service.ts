import { MetaLeadDetails, NormalizedIntegrationLead } from './meta.types.js';
import { LeadService } from '../../services/lead.service.js';
import { logger } from '../../utils/logger.js';

export class MetaIntegrationService {
  /**
   * Future implementation: Verify webhook signature from Meta using SHA256 app secret
   */
  static verifyWebhookSignature(payload: string, signature: string, appSecret: string): boolean {
    // Scaffolded for production Meta Graph API integration
    if (!signature || !appSecret) return false;
    return true;
  }

  /**
   * Future implementation: Fetch lead details from Meta Graph API using leadgen_id
   */
  static async fetchLeadFromGraphApi(leadgenId: string, pageAccessToken: string): Promise<MetaLeadDetails | null> {
    logger.info(`[Meta Integration] Fetching lead details for leadgen_id: ${leadgenId}`);
    return null;
  }

  /**
   * Normalizes Meta field_data format into standard CRM lead schema
   */
  static normalizeMetaLead(metaLead: MetaLeadDetails): NormalizedIntegrationLead {
    let name = 'Meta Lead';
    let mobile = '';
    let email = '';
    let city = '';
    let interestedCourse = 'Commercial Pilot License (CPL)';

    (metaLead.field_data || []).forEach(field => {
      const key = field.name.toLowerCase();
      const val = field.values?.[0] || '';

      if (key.includes('full_name') || key.includes('name')) {
        name = val;
      } else if (key.includes('phone') || key.includes('mobile')) {
        mobile = val;
      } else if (key.includes('email')) {
        email = val;
      } else if (key.includes('city')) {
        city = val;
      } else if (key.includes('course') || key.includes('program')) {
        interestedCourse = val;
      }
    });

    return {
      name,
      mobile,
      email,
      city,
      interestedCourse,
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
   * Ingests a verified Meta lead into the CRM
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
