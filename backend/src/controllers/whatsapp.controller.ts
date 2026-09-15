import { Request, Response, NextFunction } from 'express';
import { WhatsAppService } from '../services/whatsapp.service.js';

export class WhatsAppController {
  static async listTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(WhatsAppService.listTemplates());
    } catch (err) {
      next(err);
    }
  }

  static async bulkSend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leadIds, templateId } = req.body;

      if (!Array.isArray(leadIds) || leadIds.length === 0) {
        res.status(400).json({ error: 'leadIds must be a non-empty array.' });
        return;
      }
      if (!templateId) {
        res.status(400).json({ error: 'templateId is required.' });
        return;
      }

      const currentUser = req.user?.name || req.body?.currentUser || 'Counselor';
      const results = await WhatsAppService.bulkSend(leadIds, templateId, currentUser);
      const sentCount = results.filter(r => r.success).length;

      res.json({
        message: `${sentCount} of ${results.length} message(s) sent successfully`,
        sentCount,
        failedCount: results.length - sentCount,
        results
      });
    } catch (err) {
      next(err);
    }
  }
}
