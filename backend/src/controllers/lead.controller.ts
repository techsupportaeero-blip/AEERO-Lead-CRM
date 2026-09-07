import { Request, Response, NextFunction } from 'express';
import { LeadService } from '../services/lead.service.js';

export class LeadController {
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
      const { currentUser = 'Admin', userRole = req.user?.role || '' } = req.body || {};
      const roleUpper = String(userRole).toUpperCase();
      const nameLower = String(currentUser).toLowerCase();

      const isAdmin = roleUpper === 'ADMIN' || nameLower.includes('admin') || req.user?.role === 'ADMIN';
      if (!isAdmin) {
        res.status(403).json({
          error: 'Access Denied: Only administrators have permission to restore archived leads.'
        });
        return;
      }

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
}
