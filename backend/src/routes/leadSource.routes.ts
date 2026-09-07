import { Router } from 'express';
import { LeadSourceController } from '../controllers/leadSource.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createLeadSourceSchema, updateLeadSourceSchema } from '../validators/leadSource.validator.js';

export const leadSourceRouter = Router();

leadSourceRouter.get('/lead-sources', optionalAuthMiddleware, LeadSourceController.getLeadSources);
leadSourceRouter.post(
  '/lead-sources',
  optionalAuthMiddleware,
  validateBody(createLeadSourceSchema),
  LeadSourceController.createLeadSource
);
leadSourceRouter.put(
  '/lead-sources/:id',
  optionalAuthMiddleware,
  validateBody(updateLeadSourceSchema),
  LeadSourceController.updateLeadSource
);
leadSourceRouter.delete('/lead-sources/:id', optionalAuthMiddleware, LeadSourceController.deleteLeadSource);
