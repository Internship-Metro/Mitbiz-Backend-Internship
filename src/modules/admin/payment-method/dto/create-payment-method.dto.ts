import { z } from 'zod';
import { PaymentMethodType } from '@prisma/client';

export const CreatePaymentMethodSchema = z.object({
  name: z.string().min(2, 'Nama metode pembayaran minimal 2 karakter').max(100, 'Nama terlalu panjang'),
  type: z.nativeEnum(PaymentMethodType, {
    message: 'Tipe metode pembayaran tidak valid',
  }),
  details: z.string().max(255, 'Keterangan terlalu panjang').optional().nullable(),
  isActive: z.boolean().optional().default(true),
  outletIds: z.array(z.string()).optional(),
});

export type CreatePaymentMethodDto = z.infer<typeof CreatePaymentMethodSchema>;
