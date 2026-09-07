import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service.js';

export class PaymentController {
  static async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payments = await PaymentService.getPayments(req.params.id);
      res.json(payments);
    } catch (err) {
      next(err);
    }
  }

  static async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createdBy = req.user?.name || req.body.currentUser || 'Counselor';
      const userContext = {
        userId: req.user?.userId,
        userName: req.user?.name || createdBy
      };

      const payment = await PaymentService.recordPayment(
        req.params.id,
        req.body,
        createdBy,
        userContext
      );

      res.status(201).json(payment);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ error: err.message });
        return;
      }
      next(err);
    }
  }
}
