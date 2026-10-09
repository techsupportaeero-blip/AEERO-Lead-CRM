import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.union([z.number().positive(), z.string().transform(v => parseFloat(v))]),
  paymentMethod: z.string().optional().default('Bank Transfer'),
  referenceNo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  emiInstallmentNumber: z.union([z.number(), z.string().transform(v => parseInt(v, 10))]).optional().nullable(),
  emiTotalInstallments: z.union([z.number(), z.string().transform(v => parseInt(v, 10))]).optional().nullable(),
  currentUser: z.string().optional()
});

export const updatePaymentSchema = z.object({
  amount: z.union([
    z.number().positive(),
    z.string().transform(v => parseFloat(v)).refine(v => !isNaN(v) && v > 0, { message: 'Valid payment amount is required.' })
  ]).optional(),
  paymentMethod: z.string().optional(),
  referenceNo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  emiInstallmentNumber: z.union([z.number(), z.string().transform(v => parseInt(v, 10))]).optional().nullable(),
  emiTotalInstallments: z.union([z.number(), z.string().transform(v => parseInt(v, 10))]).optional().nullable(),
  currentUser: z.string().optional()
});
