import { z } from 'zod';

export const closeShiftSchema = z.object({
  closingCash: z.number({
    message: 'Total uang fisik di laci harus berupa angka',
  }).min(0, 'Total kas tidak boleh negatif').optional(),
  notes: z.string().optional(),
});

export type CloseShiftDto = z.infer<typeof closeShiftSchema>;
