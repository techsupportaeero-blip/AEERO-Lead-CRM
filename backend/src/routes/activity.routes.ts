import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createActivitySchema } from '../validators/activity.validator.js';

export const activityRouter = Router();

activityRouter.get('/activities', optionalAuthMiddleware, ActivityController.getAllActivities);
activityRouter.get('/leads/:id/activities', optionalAuthMiddleware, ActivityController.getActivities);
activityRouter.post(
  '/leads/:id/activities',
  optionalAuthMiddleware,
  validateBody(createActivitySchema),
  ActivityController.recordActivity
);
