import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createPaymentSchema, updatePaymentSchema } from '../validators/payment.validator.js';

export const paymentRouter = Router();

paymentRouter.get('/leads/:id/payments', authMiddleware, PaymentController.getPayments);
paymentRouter.get('/leads/:id/payment-summary', authMiddleware, PaymentController.getPaymentSummary);
paymentRouter.post(
  '/leads/:id/payments',
  authMiddleware,
  validateBody(createPaymentSchema),
  PaymentController.recordPayment
);
paymentRouter.patch(
  '/payments/:paymentId',
  authMiddleware,
  validateBody(updatePaymentSchema),
  PaymentController.updatePayment
);
