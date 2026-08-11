import { z } from 'zod';

export const openShiftSchema = z.object({
  openingCash: z.number({
    invalid_type_error: 'Modal awal harus berupa angka',
  }).min(0, 'Modal awal tidak boleh negatif').default(0),
  notes: z.string().optional(),
});

export type OpenShiftDto = z.infer<typeof openShiftSchema>;
