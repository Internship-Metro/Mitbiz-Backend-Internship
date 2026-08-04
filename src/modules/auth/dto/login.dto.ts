import { z } from 'zod';

export const LoginDto = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi') // Cukup cek isi, tidak perlu min 8 saat login
});

export type LoginType = z.infer<typeof LoginDto>;
