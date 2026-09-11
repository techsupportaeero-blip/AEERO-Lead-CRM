import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createLeadSchema, updateLeadSchema, checkDuplicateSchema } from '../validators/lead.validator.js';

export const leadRouter = Router();

// Realtime duplicate check endpoint
leadRouter.post(
  '/leads/check-duplicate',
  optionalAuthMiddleware,
  validateBody(checkDuplicateSchema),
  LeadController.checkDuplicate
);

// Bulk actions (Admin Only) - must come before the /:id routes below
leadRouter.post('/leads/bulk-archive', optionalAuthMiddleware, LeadController.bulkArchiveActive);
leadRouter.post('/leads/bulk-delete-archived', optionalAuthMiddleware, LeadController.bulkDeleteArchived);

// Lightweight count (sidebar badge, etc.) - a single COUNT query instead of
// the full /api/stats aggregate, which fetches every lead/activity/payment
// just to read one number.
leadRouter.get('/leads/count', optionalAuthMiddleware, LeadController.getLeadsCount);

// Lead CRUD
leadRouter.get('/leads', optionalAuthMiddleware, LeadController.getLeads);
leadRouter.get('/leads/:id', optionalAuthMiddleware, LeadController.getLeadById);
leadRouter.post('/leads', optionalAuthMiddleware, validateBody(createLeadSchema), LeadController.createLead);
leadRouter.put('/leads/:id', optionalAuthMiddleware, validateBody(updateLeadSchema), LeadController.updateLead);
leadRouter.put('/leads/:id/status', optionalAuthMiddleware, LeadController.updateLeadStatus);
leadRouter.post('/leads/:id/archive', optionalAuthMiddleware, LeadController.archiveLead);
leadRouter.post('/leads/:id/unarchive', optionalAuthMiddleware, LeadController.unarchiveLead);
leadRouter.delete('/leads/:id', optionalAuthMiddleware, LeadController.deleteLead);
