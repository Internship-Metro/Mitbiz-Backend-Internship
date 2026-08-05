import { z } from 'zod';

export const CreateUserDto = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().email('Format email tidak valid'),
  phone: z
    .string()
    .min(8, 'Nomor telepon minimal 8 digit')
    .max(20, 'Nomor telepon maksimal 20 digit')
    .optional(),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  role: z.enum(['ADMIN', 'STAFF']),
  roleId: z.string().cuid('roleId harus berupa CUID yang valid').optional(),
  outletId: z.string().cuid('outletId harus berupa CUID yang valid').optional(),
  businessId: z.string().cuid('businessId harus berupa CUID yang valid').optional(),
});

export type CreateUserType = z.infer<typeof CreateUserDto>;
