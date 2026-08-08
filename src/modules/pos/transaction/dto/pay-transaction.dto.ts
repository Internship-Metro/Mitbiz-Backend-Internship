import { z } from 'zod';

export const payTransactionSchema = z.object({
  paymentMethodId: z.string({ message: 'Payment method is required' }),
  amountPaid: z.number({ message: 'Amount paid is required' }).min(0, { message: 'Amount paid cannot be negative' }),
  notes: z.string().optional(),
});

export type PayTransactionDto = z.infer<typeof payTransactionSchema>;
