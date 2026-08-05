import { z } from 'zod';

export const UpdateOutletDto = z.object({
  name: z.string().min(2, 'Nama outlet minimal 2 karakter').max(100, 'Nama outlet maksimal 100 karakter').optional(),
  address: z.string().max(255, 'Alamat maksimal 255 karakter').optional(),
  phone: z.string().min(8, 'Nomor telepon minimal 8 digit').max(20, 'Nomor telepon maksimal 20 digit').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
}).strict();

export type UpdateOutletType = z.infer<typeof UpdateOutletDto>;
