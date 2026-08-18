import { z } from 'zod';

export const closeShiftSchema = z.object({
  notes: z.string().optional(),
});

export type CloseShiftDto = z.infer<typeof closeShiftSchema>;
