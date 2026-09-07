import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createPaymentSchema } from '../validators/payment.validator.js';

export const paymentRouter = Router();

paymentRouter.get('/leads/:id/payments', optionalAuthMiddleware, PaymentController.getPayments);
paymentRouter.post(
  '/leads/:id/payments',
  optionalAuthMiddleware,
  validateBody(createPaymentSchema),
  PaymentController.recordPayment
);
