import { z } from 'zod';

export const updateBusinessSchema = z.object({
  name: z.string().min(2, { message: 'Nama bisnis minimal 2 karakter' }).optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: 'Format email tidak valid' }).optional(),
  taxRate: z
    .number()
    .min(0, { message: 'Pajak (Tax rate) tidak boleh kurang dari 0' })
    .max(100, { message: 'Pajak (Tax rate) tidak boleh lebih dari 100' })
    .optional(),
  receiptFooter: z.string().optional(),
  logoUrl: z.string().url({ message: 'Format URL logo tidak valid' }).optional(),
});

export type UpdateBusinessDto = z.infer<typeof updateBusinessSchema>;
