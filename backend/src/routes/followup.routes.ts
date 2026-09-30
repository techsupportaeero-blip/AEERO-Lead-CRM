import { Router } from 'express';
import { FollowupController } from '../controllers/followup.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createFollowupSchema, updateFollowupSchema } from '../validators/followup.validator.js';

export const followupRouter = Router();

// Admin / Sr. Counsellor only - which counselor's leads are stuck at which
// follow-up stage. Must come before the plain '/followups' list route.
// Mandatory auth (not optional) - the role check in the controller reads
// req.user, which only a verified JWT populates; a client-supplied
// ?currentUser=/?userRole= query param must never be trusted for this.
followupRouter.get('/followups/stage-tracker', authMiddleware, FollowupController.getStageTracker);

followupRouter.get('/followups', optionalAuthMiddleware, FollowupController.getFollowups);
followupRouter.get('/leads/:id/followups', optionalAuthMiddleware, FollowupController.getFollowups);
followupRouter.post(
  '/leads/:id/followups',
  optionalAuthMiddleware,
  validateBody(createFollowupSchema),
  FollowupController.addFollowup
);
followupRouter.post(
  '/followups',
  optionalAuthMiddleware,
  validateBody(createFollowupSchema),
  FollowupController.addFollowup
);
followupRouter.put(
  '/followups/:id',
  optionalAuthMiddleware,
  validateBody(updateFollowupSchema),
  FollowupController.updateFollowup
);
followupRouter.delete('/followups/:id', optionalAuthMiddleware, FollowupController.deleteFollowup);
