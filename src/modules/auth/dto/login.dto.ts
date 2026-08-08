import { z } from 'zod';

export const LoginDto = z.object({
  identifier: z.string().min(1, 'Email atau username wajib diisi'), // bisa email atau username
  password: z.string().min(1, 'Password wajib diisi'),
});

export type LoginType = z.infer<typeof LoginDto>;
