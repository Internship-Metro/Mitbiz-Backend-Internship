import { z } from 'zod';

export const updateSettingSchema = z.object({
  appName: z.string().min(2, { message: 'App Name minimal 2 karakter' }).optional(),
  logoUrl: z.string().url({ message: 'Logo harus berupa URL yang valid' }).optional().nullable(),
  defaultLanguage: z.enum(['Indonesia', 'English']).optional(),
  timezone: z.enum(['GMT +7 Jakarta', 'GMT +8 Makassar', 'GMT +9 Jayapura']).optional(),
  currency: z.enum(['Rupiah (IDR)', 'US Dollar (USD)']).optional(),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
});

export type UpdateSettingDto = z.infer<typeof updateSettingSchema>;
