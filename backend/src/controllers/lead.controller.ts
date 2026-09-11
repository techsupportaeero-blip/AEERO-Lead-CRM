import { Request, Response, NextFunction } from 'express';
import { LeadService } from '../services/lead.service.js';

export class LeadController {
  // Shared admin check for destructive/restricted actions (restore, permanent delete, bulk ops).
  // Trusts req.user.role when authenticated, and falls back to a name/body-role heuristic
  // to stay compatible with the app's optional-auth (no-login) mode.
  static isAdminRequest(req: Request): boolean {
    const currentUser = req.user?.name || req.body?.currentUser || '';
    const userRole = req.user?.role || req.body?.userRole || '';
    const roleUpper = String(userRole).toUpperCase();
    const nameLower = String(currentUser).toLowerCase();
    return roleUpper === 'ADMIN' || nameLower.includes('admin');
  }

  static async checkDuplicate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mobile, email, excludeId } = req.body;
      const dupResult = await LeadService.checkDuplicate(mobile, email, excludeId);

      if (dupResult) {
        const fieldName = dupResult.field === 'email' ? 'Email Address' : 'Mobile Number';
        const fieldValue = dupResult.value || (dupResult.field === 'email' ? email : mobile);
        res.json({
          isDuplicate: true,
          duplicateField: fieldName,
          duplicateValue: fieldValue,
          existingLead: dupResult.match,
          message: `${fieldName} "${fieldValue}" is already registered to "${dupResult.match.name || 'Existing Lead'}" (Lead ID: ${dupResult.match.leadId || dupResult.match.id}).`
        });
        return;
      }

      res.json({ isDuplicate: false });
    } catch (err) {
      next(err);
    }
  }

  static async getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const leads = await LeadService.getLeads(req.query);
      res.json(leads);
    } catch (err) {
      next(err);
    }
  }

  static async getLeadsCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const totalLeads = await LeadService.getLeadsCount();
      res.json({ totalLeads });
    } catch (err) {
      next(err);
    }
  }

  static async getLeadById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await LeadService.getLeadById(req.params.id);
      if (!lead) {
        res.status(404).json({ error: 'Lead not found' });
        return;
      }
      res.json(lead);
    } catch (err) {
      next(err);
    }
  }

  static async createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext = {
        userId: req.user?.userId,
        userName: req.user?.name || req.body.createdBy || 'Counselor',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent')
      };

      const newLead = await LeadService.createLead(
        req.body,
        req.user?.name || req.body.createdBy || 'Counselor',
        userContext
      );

      // Push to every connected client in real time - same event/payload
      // shape the Google Sheets sync pipeline already emits, so the
      // frontend's existing 'newLead' listeners (sidebar count, AllLeads
      // live-prepend, Dashboard refresh) pick up manually-added leads too.
      (global as any).io?.emit('newLead', newLead);

      res.status(201).json(newLead);
    } catch (err: any) {
      if (err.isDuplicate || err.code === 'DUPLICATE_LEAD') {
        res.status(409).json({
          error: err.message,
          isDuplicate: true,
          duplicateField: err.duplicateField,
          duplicateValue: err.duplicateValue,
          existingLead: err.existingLead
        });
        return;
      }
      next(err);
    }
  }

  static async updateLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext = {
        userId: req.user?.userId,
        userName: req.user?.name || req.body.updatedBy || 'Counselor',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent')
      };

      const updated = await LeadService.updateLead(
        req.params.id,
        req.body,
        req.user?.name || req.body.updatedBy || 'Counselor',
        userContext
      );

      res.json(updated);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ error: err.message });
        return;
      }
      next(err);
    }
  }

  static async updateLeadStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, updatedBy } = req.body;
      const userContext = {
        userId: req.user?.userId,
        userName: req.user?.name || updatedBy || 'Counselor'
      };

      const updated = await LeadService.updateLeadStatus(
        req.params.id,
        status,
        req.user?.name || updatedBy || 'Counselor',
        userContext
      );

      res.json(updated);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ error: err.message });
        return;
      }
      next(err);
    }
  }

  static async archiveLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUser = req.user?.name || req.body.currentUser || 'System';
      const archived = await LeadService.archiveLead(req.params.id, currentUser);
      res.json({ message: 'Lead archived successfully', leadId: archived.leadId });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ error: 'Lead not found for archiving' });
        return;
      }
      next(err);
    }
  }

  static async unarchiveLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!LeadController.isAdminRequest(req)) {
        res.status(403).json({
          error: 'Access Denied: Only administrators have permission to restore archived leads.'
        });
        return;
      }

      const currentUser = req.user?.name || req.body?.currentUser || 'Admin';
      const restored = await LeadService.unarchiveLead(req.params.id, currentUser);
      res.json({ message: 'Lead unarchived & restored successfully', lead: restored });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ error: 'Lead not found for restoring' });
        return;
      }
      next(err);
    }
  }

  static async deleteLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!LeadController.isAdminRequest(req)) {
        res.status(403).json({
          error: 'Access Denied: Only administrators have permission to permanently delete leads.'
        });
        return;
      }

      const currentUser = req.user?.name || req.body.currentUser || 'Admin';
      await LeadService.deleteLead(req.params.id, currentUser);
      res.json({ message: 'Lead deleted permanently', leadId: req.params.id });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ error: 'Lead not found' });
        return;
      }
      next(err);
    }
  }

  // Bulk-archive every active lead in one shot (Admin Only) - powers "Clear All"
  // on the Active Leads view.
  static async bulkArchiveActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!LeadController.isAdminRequest(req)) {
        res.status(403).json({
          error: 'Access Denied: Only administrators can bulk-archive all leads.'
        });
        return;
      }

      const currentUser = req.user?.name || req.body?.currentUser || 'Admin';
      const count = await LeadService.bulkArchiveActive(currentUser);
      res.json({ message: `${count} lead(s) moved to Archive`, count });
    } catch (err) {
      next(err);
    }
  }

  // Permanently delete every archived lead in one shot (Admin Only, irreversible) -
  // powers "Clear All" on the Archived Leads view.
  static async bulkDeleteArchived(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!LeadController.isAdminRequest(req)) {
        res.status(403).json({
          error: 'Access Denied: Only administrators can permanently delete archived leads.'
        });
        return;
      }

      const currentUser = req.user?.name || req.body?.currentUser || 'Admin';
      const count = await LeadService.bulkDeleteArchived(currentUser);
      res.json({ message: `${count} archived lead(s) permanently deleted`, count });
    } catch (err) {
      next(err);
    }
  }
}
