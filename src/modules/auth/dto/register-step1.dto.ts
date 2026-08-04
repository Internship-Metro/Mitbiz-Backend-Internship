import { z } from 'zod';

export const RegisterStep1Dto = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().min(10, 'Nomor HP minimal 10 digit').optional(),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'] // error akan muncul di field ini
});

// Infer type untuk TypeScript
export type RegisterStep1Type = z.infer<typeof RegisterStep1Dto>;
