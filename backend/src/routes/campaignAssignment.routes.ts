import { Router } from 'express';
import { CampaignAssignmentController } from '../controllers/campaignAssignment.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';

export const campaignAssignmentRouter = Router();

campaignAssignmentRouter.get('/campaign-assignments', optionalAuthMiddleware, CampaignAssignmentController.listAssignments);
campaignAssignmentRouter.post('/campaign-assignments', optionalAuthMiddleware, CampaignAssignmentController.setAssignment);
campaignAssignmentRouter.delete('/campaign-assignments/:campaignName', optionalAuthMiddleware, CampaignAssignmentController.removeAssignment);
