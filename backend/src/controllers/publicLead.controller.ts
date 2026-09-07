import { Request, Response, NextFunction } from 'express';
import { LeadService } from '../services/lead.service.js';

export class PublicLeadController {
  static async submitPublicLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publicData = req.body;

      const userContext = {
        userName: 'Website Form API',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent')
      };

      const newLead = await LeadService.createLead(
        {
          ...publicData,
          source: publicData.source || 'Website',
          campaign: publicData.campaign || 'Public Website Form',
          status: 'NEW',
          priority: 'MEDIUM',
          tags: ['Website Lead', 'Public Form']
        },
        'Website API',
        userContext
      );

      res.status(201).json({
        success: true,
        message: 'Lead successfully submitted via website API',
        leadId: newLead.leadId,
        lead: newLead
      });
    } catch (err: any) {
      if (err.isDuplicate || err.code === 'DUPLICATE_LEAD') {
        res.status(409).json({
          success: false,
          error: err.message || 'Lead with this mobile/email already exists.',
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
}
