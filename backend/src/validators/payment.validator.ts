import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.union([z.number().positive(), z.string().transform(v => parseFloat(v))]),
  paymentMethod: z.string().optional().default('Bank Transfer'),
  referenceNo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  currentUser: z.string().optional()
});
