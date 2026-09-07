export class WebsiteIntegrationService {
  static normalizeWebsiteWebhook(payload: Record<string, any>) {
    return {
      name: payload.name || payload.fullName || 'Website Lead',
      mobile: payload.mobile || payload.phone || '',
      email: payload.email || '',
      city: payload.city || '',
      state: payload.state || '',
      interestedCourse: payload.interestedCourse || payload.course || 'Commercial Pilot License (CPL)',
      source: 'Website',
      platform: payload.platform || 'Direct Website',
      campaign: payload.campaign || 'Web Organic',
      utmSource: payload.utmSource || payload.utm_source || 'website',
      utmMedium: payload.utmMedium || payload.utm_medium || 'form',
      utmCampaign: payload.utmCampaign || payload.utm_campaign,
      externalSource: 'Website_Form'
    };
  }
}
