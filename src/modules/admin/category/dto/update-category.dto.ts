import { z } from 'zod';

export const updateCategorySchema = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter').max(50, 'Nama kategori maksimal 50 karakter').optional(),
});

export type UpdateCategoryType = z.infer<typeof updateCategorySchema>;
