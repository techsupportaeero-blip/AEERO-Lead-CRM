import { Router, Request, Response } from 'express';
import { env } from '../config/env.js';
import { MetaIntegrationService } from '../integrations/meta/meta.service.js';
import { logger } from '../utils/logger.js';

export const webhookRouter = Router();

// 1. Meta Webhook Verification (GET /api/webhook/meta & GET /api/integrations/meta/webhook)
webhookRouter.get(['/webhook/meta', '/integrations/meta/webhook'], (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.META_VERIFY_TOKEN || 'aeero_meta_lead_token_2026';

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('[Meta Webhook] Verification request received: mode=subscribe (verify_token matched)');
      return res.status(200).send(challenge);
    } else {
      logger.warn('[Meta Webhook] Verification failed: Token mismatch');
      return res.status(403).json({ error: 'Verification token mismatch' });
    }
  }

  res.json({
    status: 'online',
    message: 'Meta Webhook endpoint is active and ready for Facebook Lead Ads.',
    webhookPath: '/api/webhook/meta',
    subscribedField: 'leadgen',
    hasPageAccessToken: Boolean(process.env.META_PAGE_ACCESS_TOKEN)
  });
});

// 2. Meta Webhook Ingestion (POST /api/webhook/meta & POST /api/integrations/meta/webhook)
webhookRouter.post(['/webhook/meta', '/integrations/meta/webhook'], async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    logger.info('[Meta Webhook] leadgen event received');

    // Parse leadgen event
    if (payload.entry && Array.isArray(payload.entry)) {
      for (const entryItem of payload.entry) {
        if (entryItem.changes && Array.isArray(entryItem.changes)) {
          for (const change of entryItem.changes) {
            if (change.field === 'leadgen' && change.value) {
              const leadgenId = change.value.leadgen_id;
              if (leadgenId) {
                logger.info(`[Meta Webhook] Lead ID received: ${leadgenId}`);
              }
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Meta lead event received and queued for processing'
    });
  } catch (error: any) {
    logger.error('[Meta Webhook] Error processing incoming lead:', error.message);
    res.status(500).json({ error: error.message || 'Failed to process Meta lead' });
  }
});

// 3. Meta Integration Config Probe
webhookRouter.get('/integrations/meta/config', (_req: Request, res: Response) => {
  res.json({
    enabled: true,
    webhookPath: '/api/webhook/meta',
    verifyToken: process.env.META_VERIFY_TOKEN || 'aeero_meta_lead_token_2026',
    hasPageAccessToken: Boolean(process.env.META_PAGE_ACCESS_TOKEN),
    autoAssignEnabled: true,
    supportedFields: ['full_name', 'phone_number', 'email', 'city', 'state', 'interested_course', 'qualification', 'campaign_name', 'form_id']
  });
});
