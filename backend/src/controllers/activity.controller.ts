import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../services/activity.service.js';

export class ActivityController {
  static async getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activities = await ActivityService.getActivities(req.params.id);
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

      const allActivities = await ActivityService.getActivities(req.params.id);

      res.status(201).json({
        message: 'Call activity saved successfully',
        activity,
        activities: allActivities
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
