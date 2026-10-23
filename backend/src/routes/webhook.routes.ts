import { Router, Request, Response } from 'express';
import { env } from '../config/env.js';
import { MetaIntegrationService } from '../integrations/meta/meta.service.js';
import { logger } from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const webhookRouter = Router();

// 1. Meta Webhook Verification (GET /api/webhook/meta & GET /api/integrations/meta/webhook)
webhookRouter.get(['/webhook/meta', '/integrations/meta/webhook'], (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.META_VERIFY_TOKEN;
  if (!verifyToken) {
    logger.error('[Meta Webhook] META_VERIFY_TOKEN not set - rejecting verification request.');
    return res.status(503).json({ error: 'Meta webhook is not configured on this server.' });
  }

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
    const appSecret = process.env.META_APP_SECRET;
    const signatureHeader = req.headers['x-hub-signature-256'] as string | undefined;
    const rawBody: Buffer | undefined = (req as any).rawBody;

    if (!appSecret) {
      // Can't verify who sent this without the secret - processing it
      // anyway would let anyone who knows this URL inject fake "leads" into
      // the CRM. Reject instead of silently trusting an unverified payload.
      logger.error('[Meta Webhook] META_APP_SECRET not set - rejecting request.');
      res.status(503).json({ error: 'Meta webhook is not configured on this server.' });
      return;
    }

    const validSignature = MetaIntegrationService.verifyWebhookSignature(rawBody, signatureHeader, appSecret);
    if (!validSignature) {
      logger.warn('[Meta Webhook] Rejected: signature verification failed.');
      res.status(403).json({ error: 'Invalid signature' });
      return;
    }

    const payload = req.body;
    const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
    let created = 0;
    let skipped = 0;
    let failed = 0;

    if (payload.entry && Array.isArray(payload.entry)) {
      for (const entryItem of payload.entry) {
        if (!entryItem.changes || !Array.isArray(entryItem.changes)) continue;

        for (const change of entryItem.changes) {
          if (change.field !== 'leadgen' || !change.value?.leadgen_id) continue;

          const leadgenId = change.value.leadgen_id;
          logger.info(`[Meta Webhook] Processing leadgen_id: ${leadgenId}`);

          try {
            const details = await MetaIntegrationService.fetchLeadFromGraphApi(leadgenId, pageAccessToken);
            if (!details) {
              logger.error(`[Meta Webhook] Could not fetch details for lead ${leadgenId} (check META_PAGE_ACCESS_TOKEN).`);
              failed++;
              continue;
            }

            const normalized = MetaIntegrationService.normalizeMetaLead(details);
            const result = await MetaIntegrationService.processIncomingLead(normalized);
            logger.info(`[Meta Webhook] Lead ${leadgenId} created as ${result.leadId}`);
            created++;
          } catch (err: any) {
            // A duplicate (same mobile/email, or a redelivered webhook event
            // for a leadgen_id we've already processed) isn't a real
            // failure - Meta retries webhooks, so this is expected.
            if (err.isDuplicate || err.code === 'DUPLICATE_LEAD' || err.code === 'P2002') {
              logger.info(`[Meta Webhook] Lead ${leadgenId} already exists - skipping.`);
              skipped++;
            } else {
              logger.error(`[Meta Webhook] Failed to process lead ${leadgenId}: ${err.message}`);
              failed++;
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Meta lead event processed',
      created,
      skipped,
      failed
    });
  } catch (error: any) {
    logger.error('[Meta Webhook] Error processing incoming lead:', error.message);
    res.status(500).json({ error: error.message || 'Failed to process Meta lead' });
  }
});

// 3. Meta Integration Config Probe - internal status only, never the actual
// secret values (this used to echo the real META_VERIFY_TOKEN back in the
// response to anyone, logged in or not).
webhookRouter.get('/integrations/meta/config', authMiddleware, (_req: Request, res: Response) => {
  res.json({
    enabled: true,
    webhookPath: '/api/webhook/meta',
    verifyTokenConfigured: Boolean(process.env.META_VERIFY_TOKEN),
    hasPageAccessToken: Boolean(process.env.META_PAGE_ACCESS_TOKEN),
    autoAssignEnabled: true,
    supportedFields: ['full_name', 'phone_number', 'email', 'city', 'state', 'interested_course', 'qualification', 'campaign_name', 'form_id']
  });
});
