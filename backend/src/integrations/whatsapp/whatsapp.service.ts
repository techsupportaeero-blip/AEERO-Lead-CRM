export interface WhatsAppWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: { body: string };
  type: string;
}

export class WhatsAppIntegrationService {
  static normalizeWhatsAppMessage(msg: WhatsAppWebhookMessage) {
    return {
      mobile: msg.from,
      whatsappNumber: msg.from,
      source: 'WhatsApp',
      platform: 'WhatsApp Cloud API',
      externalLeadId: msg.id,
      externalSource: 'WhatsApp_Direct'
    };
  }
}
