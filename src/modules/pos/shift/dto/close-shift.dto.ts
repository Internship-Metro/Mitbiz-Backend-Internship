import { z } from 'zod';

export const closeShiftSchema = z.object({
  closingCash: z.number({
    message: 'Total uang fisik di laci harus berupa angka dan wajib diisi',
  }).min(0, 'Total kas tidak boleh negatif'),
  notes: z.string().optional(),
});

export type CloseShiftDto = z.infer<typeof closeShiftSchema>;
