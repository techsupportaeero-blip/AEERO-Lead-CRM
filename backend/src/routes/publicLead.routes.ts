import { Router } from 'express';
import { PublicLeadController } from '../controllers/publicLead.controller.js';
import { publicLeadRateLimiter } from '../middleware/rateLimit.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { publicLeadSchema } from '../validators/lead.validator.js';

export const publicLeadRouter = Router();

// Public Lead Capture API (Forms, WordPress, Meta Webhooks, Landing pages)
publicLeadRouter.post(
  '/public/leads',
  publicLeadRateLimiter,
  validateBody(publicLeadSchema),
  PublicLeadController.submitPublicLead
);
