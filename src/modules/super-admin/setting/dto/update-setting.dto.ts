import { z } from 'zod';

export const updateSettingSchema = z.object({
  appName: z.string().min(2, { message: 'App Name minimal 2 karakter' }).optional(),
  logoUrl: z.string().url({ message: 'Logo harus berupa URL yang valid' }).optional().nullable(),
  defaultLanguage: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  dateFormat: z.string().optional(),
});

export type UpdateSettingDto = z.infer<typeof updateSettingSchema>;
