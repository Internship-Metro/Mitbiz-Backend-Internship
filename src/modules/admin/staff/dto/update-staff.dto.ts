import { z } from 'zod';

export const UpdateStaffDto = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter').optional(),
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(30, 'Username maksimal 30 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore')
    .optional(),
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
