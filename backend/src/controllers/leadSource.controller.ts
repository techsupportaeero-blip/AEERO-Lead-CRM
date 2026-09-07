import { Request, Response, NextFunction } from 'express';
import { LeadSourceService } from '../services/leadSource.service.js';

export class LeadSourceController {
  static async getLeadSources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sources = await LeadSourceService.getLeadSources();
      res.json(sources);
    } catch (err) {
      next(err);
    }
  }

  static async createLeadSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const source = await LeadSourceService.createLeadSource(req.body);
      res.status(201).json(source);
    } catch (err) {
      next(err);
    }
  }

  static async updateLeadSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await LeadSourceService.updateLeadSource(id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteLeadSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await LeadSourceService.deleteLeadSource(id);
      res.json({ message: 'Lead source deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
