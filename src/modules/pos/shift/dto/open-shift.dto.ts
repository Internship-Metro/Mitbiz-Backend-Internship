import { z } from 'zod';

export const openShiftSchema = z.object({
  notes: z.string().optional(),
});

export type OpenShiftDto = z.infer<typeof openShiftSchema>;
