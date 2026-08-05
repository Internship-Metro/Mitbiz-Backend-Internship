import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter').max(50, 'Nama kategori maksimal 50 karakter'),
  branchId: z.string().min(1, 'ID Cabang wajib diisi'),
});

export type CreateCategoryType = z.infer<typeof createCategorySchema>;
