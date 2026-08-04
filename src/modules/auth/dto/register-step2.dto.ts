import { z } from 'zod';

export const RegisterStep2Dto = z.object({
  businessName: z.string().min(3, 'Nama bisnis minimal 3 karakter'),
  businessCategory: z.string().min(1, 'Kategori bisnis wajib diisi'),
  city: z.string().min(1, 'Kota wajib diisi'),
  province: z.string().min(1, 'Provinsi wajib diisi')
});

export type RegisterStep2Type = z.infer<typeof RegisterStep2Dto>;
