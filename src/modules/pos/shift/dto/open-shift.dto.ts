import { z } from 'zod';

export const openShiftSchema = z.object({
  openingCash: z.number({
    message: 'Modal awal harus berupa angka dan wajib diisi',
  }).min(0, 'Modal awal tidak boleh negatif'),
  notes: z.string().optional(),
});

export type OpenShiftDto = z.infer<typeof openShiftSchema>;
