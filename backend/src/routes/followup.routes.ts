import { Router } from 'express';
import { FollowupController } from '../controllers/followup.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createFollowupSchema, updateFollowupSchema } from '../validators/followup.validator.js';

export const followupRouter = Router();

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
