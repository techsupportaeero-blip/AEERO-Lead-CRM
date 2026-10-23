import { Router } from 'express';
import { LeadSourceController } from '../controllers/leadSource.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createLeadSourceSchema, updateLeadSourceSchema } from '../validators/leadSource.validator.js';

export const leadSourceRouter = Router();

leadSourceRouter.get('/lead-sources', authMiddleware, LeadSourceController.getLeadSources);
leadSourceRouter.post(
  '/lead-sources',
  authMiddleware,
  validateBody(createLeadSourceSchema),
  LeadSourceController.createLeadSource
);
leadSourceRouter.put(
  '/lead-sources/:id',
  authMiddleware,
  validateBody(updateLeadSourceSchema),
  LeadSourceController.updateLeadSource
);
leadSourceRouter.delete('/lead-sources/:id', authMiddleware, LeadSourceController.deleteLeadSource);
