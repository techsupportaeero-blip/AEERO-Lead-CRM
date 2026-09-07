import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/auditLog.service.js';

export class AuditLogController {
  static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await AuditLogService.getAuditLogs();
      res.json(logs);
    } catch (err) {
      next(err);
    }
  }
}
