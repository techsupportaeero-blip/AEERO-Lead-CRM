import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createActivitySchema } from '../validators/activity.validator.js';

export const activityRouter = Router();

activityRouter.get('/activities', authMiddleware, ActivityController.getAllActivities);
activityRouter.get('/leads/:id/activities', authMiddleware, ActivityController.getActivities);
activityRouter.post(
  '/leads/:id/activities',
  authMiddleware,
  validateBody(createActivitySchema),
  ActivityController.recordActivity
);
