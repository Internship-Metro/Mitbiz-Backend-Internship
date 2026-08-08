import { z } from 'zod';

export const UpdateUserDto = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter').optional(),
  phone: z
    .string()
    .min(8, 'Nomor telepon minimal 8 digit')
    .max(20, 'Nomor telepon maksimal 20 digit')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  businessId: z.string().cuid('businessId harus berupa CUID yang valid').optional(),
  /**
   * Pindah user ke outlet lain (relevan untuk STAFF)
   * Kirim null untuk melepas user dari outlet
   */
  outletId: z.string().cuid('outletId harus berupa CUID yang valid').nullable().optional(),
});

export type UpdateUserType = z.infer<typeof UpdateUserDto>;
