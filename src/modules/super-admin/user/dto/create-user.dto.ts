import { z } from 'zod';

export const CreateUserDto = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  /**
   * Username — wajib untuk STAFF (dipakai login), opsional untuk ADMIN
   * Format: huruf, angka, underscore saja
   */
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(30, 'Username maksimal 30 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore')
    .optional(),
  /**
   * Email — wajib untuk ADMIN (dipakai login), opsional untuk STAFF
   */
  email: z.string().email('Format email tidak valid').optional(),
  phone: z
    .string()
    .min(8, 'Nomor telepon minimal 8 digit')
    .max(20, 'Nomor telepon maksimal 20 digit')
    .optional(),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  businessId: z.string().cuid('businessId harus berupa CUID yang valid'),
  /**
   * Role yang akan diberikan ke user baru.
   * - ADMIN  : Pemilik / Administrator bisnis (tidak perlu outletId, wajib email)
   * - STAFF  : Kasir / pegawai (perlu outletId, wajib username)
   * Default: ADMIN
   */
  role: z.enum(['ADMIN', 'STAFF']).optional().default('ADMIN'),
  /**
   * ID outlet tempat user ini bertugas.
   * Wajib jika role = STAFF, opsional jika role = ADMIN.
   */
  outletId: z.string().cuid('outletId harus berupa CUID yang valid').optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'STAFF') {
    // STAFF wajib punya username
    if (!data.username) {
      ctx.addIssue({ code: 'custom', message: 'username wajib diisi untuk STAFF', path: ['username'] });
    }
    // STAFF wajib punya outletId
    if (!data.outletId) {
      ctx.addIssue({ code: 'custom', message: 'outletId wajib diisi jika role adalah STAFF', path: ['outletId'] });
    }
  } else {
    // ADMIN wajib punya email
    if (!data.email) {
      ctx.addIssue({ code: 'custom', message: 'email wajib diisi untuk ADMIN', path: ['email'] });
    }
  }
});

export type CreateUserType = z.infer<typeof CreateUserDto>;
