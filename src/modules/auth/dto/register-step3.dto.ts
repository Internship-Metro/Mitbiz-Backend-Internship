import { z } from 'zod';

export const RegisterStep3Dto = z.object({
  outletName: z.string().min(3, 'Nama outlet minimal 3 karakter'),
  outletAddress: z.string().optional(),
  outletPhone: z.string().optional()
});

export type RegisterStep3Type = z.infer<typeof RegisterStep3Dto>;
