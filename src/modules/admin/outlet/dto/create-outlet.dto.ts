import { z } from 'zod';

export const CreateOutletDto = z.object({
  businessId: z.string().cuid('businessId harus berupa CUID yang valid').optional(),
  name: z.string().min(2, 'Nama outlet minimal 2 karakter').max(100, 'Nama outlet maksimal 100 karakter'),
  address: z.string().max(255, 'Alamat maksimal 255 karakter').optional(),
  phone: z.string().min(8, 'Nomor telepon minimal 8 digit').max(20, 'Nomor telepon maksimal 20 digit').optional(),
}).strict();

export type CreateOutletType = z.infer<typeof CreateOutletDto>;
