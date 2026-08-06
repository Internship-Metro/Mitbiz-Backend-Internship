import { z } from 'zod';

export const UpdateStaffDto = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter').optional(),
  phone: z
    .string()
    .min(8, 'Nomor telepon minimal 8 digit')
    .max(20, 'Nomor telepon maksimal 20 digit')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  roleId: z.string().cuid('roleId harus berupa CUID yang valid').optional(),
  outletId: z.string().cuid('outletId harus berupa CUID yang valid').optional(),
  avatarUrl: z.string().url('avatarUrl harus berupa URL yang valid').optional(),
});

export type UpdateStaffType = z.infer<typeof UpdateStaffDto>;
