import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service.js';

export class DashboardController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await DashboardService.getStats(req.query);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }

  static async getConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await DashboardService.getConfig();
      res.json(config);
    } catch (err) {
      next(err);
    }
  }
}
