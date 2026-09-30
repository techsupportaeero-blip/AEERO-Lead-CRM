import { Request, Response, NextFunction } from 'express';
import { WhatsAppTemplateService } from '../services/whatsappTemplate.service.js';

export class WhatsAppTemplateController {
  static async getTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = await WhatsAppTemplateService.getAllTemplates();
      res.json(templates);
    } catch (err) {
      next(err);
    }
  }

  static async createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Access Denied: Only administrators can add WhatsApp templates.' });
        return;
      }
      const template = await WhatsAppTemplateService.createTemplate(req.body);
      res.status(201).json(template);
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        res.status(409).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  static async updateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Access Denied: Only administrators can edit WhatsApp templates.' });
        return;
      }
      const template = await WhatsAppTemplateService.updateTemplate(parseInt(req.params.id, 10), req.body);
      res.json(template);
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        res.status(409).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  static async deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Access Denied: Only administrators can delete WhatsApp templates.' });
        return;
      }
      await WhatsAppTemplateService.deleteTemplate(parseInt(req.params.id, 10));
      res.json({ success: true, message: 'Template deleted.' });
    } catch (err) {
      next(err);
    }
  }
}
