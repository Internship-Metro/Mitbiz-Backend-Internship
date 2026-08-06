import { z } from 'zod';

export const ResetPasswordDto = z
  .object({
    newPassword: z.string().min(8, 'Password minimal 8 karakter'),
    confirmNewPassword: z.string().min(8, 'Konfirmasi password minimal 8 karakter'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmNewPassword'],
  });

export type ResetPasswordType = z.infer<typeof ResetPasswordDto>;
