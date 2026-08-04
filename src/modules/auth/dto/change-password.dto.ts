import { z } from 'zod';

export const ChangePasswordDto = z.object({
  oldPassword: z.string().min(1, 'Password lama wajib diisi'),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
  confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Konfirmasi password baru tidak cocok',
  path: ['confirmNewPassword']
});

export type ChangePasswordType = z.infer<typeof ChangePasswordDto>;
