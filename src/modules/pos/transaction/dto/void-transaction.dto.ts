import { z } from 'zod';

export const voidTransactionSchema = z.object({
  voidReason: z.string({ message: 'Void reason is required' }).min(5, { message: 'Void reason must be at least 5 characters' }),
});

export type VoidTransactionDto = z.infer<typeof voidTransactionSchema>;
