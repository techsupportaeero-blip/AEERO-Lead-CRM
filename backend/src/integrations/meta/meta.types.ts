export interface MetaLeadgenWebhookEntry {
  id: string;
  time: number;
  changes: Array<{
    field: string;
    value: {
      ad_id: string;
      form_id: string;
      leadgen_id: string;
      created_time: number;
      page_id: string;
      adgroup_id?: string;
    };
  }>;
}

export interface MetaLeadDetails {
  id: string;
  created_time: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}

export interface NormalizedIntegrationLead {
  name: string;
  mobile: string;
  email?: string;
  city?: string;
  state?: string;
  interestedCourse?: string;
  source: string;
  platform: string;
  campaign?: string;
  campaignId?: string;
  adSet?: string;
  adSetId?: string;
  ad?: string;
  adId?: string;
  formId?: string;
  externalLeadId?: string;
  externalSource: string;
}
