import { Request, Response, NextFunction } from 'express';
import { FollowupService } from '../services/followup.service.js';

export class FollowupController {
  // Admin or Sr. Counsellor only. Reads req.user (set only by a verified
  // JWT via authMiddleware) - never a client-supplied body/query field,
  // which anyone could spoof to claim any role or name.
  static isElevatedRequest(req: Request): boolean {
    const role = String(req.user?.role || '').toUpperCase();
    return role === 'ADMIN' || role === 'SR_COUNSELLOR';
  }

  static async getStageTracker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!FollowupController.isElevatedRequest(req)) {
        res.status(403).json({
          error: 'Access Denied: Only administrators or Sr. Counsellor can view the follow-up stage tracker.'
        });
        return;
      }
      const tracker = await FollowupService.getStageTracker();
      res.json(tracker);
    } catch (err) {
      next(err);
    }
  }

  static async getFollowups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const followups = await FollowupService.getFollowups(req.params.id, req.query);
      res.json(followups);
    } catch (err) {
      next(err);
    }
  }

  static async addFollowup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const leadId = req.params.id || req.body.leadId;
      const createdBy = req.user?.name || req.body.createdBy || 'Counselor';
      const followup = await FollowupService.addFollowup(leadId, req.body, createdBy);
      res.status(201).json(followup);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ error: err.message });
        return;
      }
      next(err);
    }
  }

  static async updateFollowup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await FollowupService.updateFollowup(id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteFollowup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await FollowupService.deleteFollowup(id);
      res.json({ message: 'Followup deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
