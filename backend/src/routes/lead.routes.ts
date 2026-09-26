import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller.js';
import { optionalAuthMiddleware, authMiddleware } from '../middleware/auth.middleware.js';
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
// Mandatory auth (not optional) on the read paths below - visibility
// restriction (a counselor only sees their own leads) requires a verified
// req.user, not a client-supplied body field that anyone could spoof.
leadRouter.get('/leads/count', authMiddleware, LeadController.getLeadsCount);

// Lead CRUD
leadRouter.get('/leads', authMiddleware, LeadController.getLeads);
leadRouter.get('/leads/:id', authMiddleware, LeadController.getLeadById);
leadRouter.post('/leads', optionalAuthMiddleware, validateBody(createLeadSchema), LeadController.createLead);
leadRouter.put('/leads/:id', optionalAuthMiddleware, validateBody(updateLeadSchema), LeadController.updateLead);
leadRouter.put('/leads/:id/status', optionalAuthMiddleware, LeadController.updateLeadStatus);
leadRouter.post('/leads/:id/archive', optionalAuthMiddleware, LeadController.archiveLead);
leadRouter.post('/leads/:id/unarchive', optionalAuthMiddleware, LeadController.unarchiveLead);
leadRouter.delete('/leads/:id', optionalAuthMiddleware, LeadController.deleteLead);
