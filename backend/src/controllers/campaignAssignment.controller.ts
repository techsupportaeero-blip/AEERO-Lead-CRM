import { Request, Response, NextFunction } from 'express';
import { CampaignAssignmentService } from '../services/campaignAssignment.service.js';

// Admin, or the Sr. Counsellor (Indu) - matches the frontend's
// canManageArchive gate (isAdmin || name includes 'INDU').
function isAuthorized(req: Request): boolean {
  const currentUser = req.user?.name || req.body?.currentUser || '';
  const userRole = req.user?.role || req.body?.userRole || '';
  const roleUpper = String(userRole).toUpperCase();
  const nameUpper = String(currentUser).toUpperCase();
  return roleUpper === 'ADMIN' || nameUpper.includes('ADMIN') || nameUpper.includes('INDU');
}

export class CampaignAssignmentController {
  static async listAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assignments = await CampaignAssignmentService.listAssignments();
      res.json(assignments);
    } catch (err) {
      next(err);
    }
  }

  static async setAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!isAuthorized(req)) {
        res.status(403).json({ error: 'Access Denied: Only Admin or Sr. Counsellor can assign campaigns.' });
        return;
      }

      const { campaignName, ownerId, reassignExisting } = req.body;
      if (!campaignName || !ownerId) {
        res.status(400).json({ error: 'campaignName and ownerId are required.' });
        return;
      }

      const currentUser = req.user?.name || req.body?.currentUser || 'Admin';
      const { assignment, reassignedCount } = await CampaignAssignmentService.setAssignment(
        campaignName,
        ownerId,
        currentUser,
        Boolean(reassignExisting)
      );

      res.json({
        message: reassignExisting
          ? `Campaign "${campaignName}" assigned to ${ownerId}. ${reassignedCount} existing lead(s) reassigned.`
          : `Campaign "${campaignName}" assigned to ${ownerId}. New leads will go to them; existing leads unchanged.`,
        assignment,
        reassignedCount
      });
    } catch (err) {
      next(err);
    }
  }

  static async removeAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!isAuthorized(req)) {
        res.status(403).json({ error: 'Access Denied: Only Admin or Sr. Counsellor can remove campaign assignments.' });
        return;
      }

      const campaignName = decodeURIComponent(req.params.campaignName);
      await CampaignAssignmentService.removeAssignment(campaignName);
      res.json({ message: `Assignment for "${campaignName}" removed. It will fall back to auto-assignment.` });
    } catch (err) {
      next(err);
    }
  }
}
