import { z } from 'zod';

export const CreateOutletDto = z.object({
  businessId: z.string().cuid('businessId harus berupa CUID yang valid'),
  name: z
    .string()
    .min(2, 'Nama outlet minimal 2 karakter')
    .max(100, 'Nama outlet maksimal 100 karakter'),
  address: z
    .string()
    .min(5, 'Alamat minimal 5 karakter')
    .max(255, 'Alamat maksimal 255 karakter'),
  phone: z
    .string()
    .min(8, 'Nomor telepon minimal 8 digit')
    .max(20, 'Nomor telepon maksimal 20 digit')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
});

export type CreateOutletType = z.infer<typeof CreateOutletDto>;
