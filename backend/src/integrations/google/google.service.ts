export interface GoogleLeadFormWebhookPayload {
  lead_id: string;
  form_id: string;
  campaign_id: string;
  gclid?: string;
  user_column_data: Array<{
    column_id: string;
    string_value: string;
  }>;
}

export class GoogleIntegrationService {
  static normalizeGoogleLead(payload: GoogleLeadFormWebhookPayload) {
    let name = 'Google Ads Lead';
    let mobile = '';
    let email = '';

    (payload.user_column_data || []).forEach(col => {
      const id = col.column_id.toLowerCase();
      if (id.includes('full_name') || id.includes('name')) name = col.string_value;
      else if (id.includes('phone') || id.includes('mobile')) mobile = col.string_value;
      else if (id.includes('email')) email = col.string_value;
    });

    return {
      name,
      mobile,
      email,
      source: 'Google Ads',
      platform: 'Google Search / Display',
      campaignId: payload.campaign_id,
      formId: payload.form_id,
      gclid: payload.gclid,
      externalLeadId: payload.lead_id,
      externalSource: 'Google_Lead_Form'
    };
  }
}
