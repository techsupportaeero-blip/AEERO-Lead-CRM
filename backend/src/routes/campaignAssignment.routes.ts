import { Router } from 'express';
import { CampaignAssignmentController } from '../controllers/campaignAssignment.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { setCampaignAssignmentSchema } from '../validators/campaignAssignment.validator.js';

export const campaignAssignmentRouter = Router();

campaignAssignmentRouter.get('/campaign-assignments', authMiddleware, CampaignAssignmentController.listAssignments);
campaignAssignmentRouter.post('/campaign-assignments', authMiddleware, validateBody(setCampaignAssignmentSchema), CampaignAssignmentController.setAssignment);
campaignAssignmentRouter.delete('/campaign-assignments/:campaignName', authMiddleware, CampaignAssignmentController.removeAssignment);
