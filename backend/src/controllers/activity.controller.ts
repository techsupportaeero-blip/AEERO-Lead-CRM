import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../services/activity.service.js';
import { LeadService } from '../services/lead.service.js';

export class ActivityController {
  static async getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activities = await ActivityService.getActivities(req.params.id);
      res.json(activities);
    } catch (err) {
      next(err);
    }
  }

  static async getAllActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activities = await ActivityService.getAllActivities(req.query);
      res.json(activities);
    } catch (err) {
      next(err);
    }
  }

  static async recordActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createdBy = req.user?.name || req.body.createdBy || 'Counselor';
      const activity = await ActivityService.recordActivity(
        req.params.id,
        req.body,
        createdBy,
        req.user?.userId
      );

      const [allActivities, updatedLead] = await Promise.all([
        ActivityService.getActivities(req.params.id),
        LeadService.getLeadById(req.params.id)
      ]);

      res.status(201).json({
        message: 'Call activity saved successfully',
        activity,
        activities: allActivities,
        lead: updatedLead
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ error: err.message });
        return;
      }
      next(err);
    }
  }
}
