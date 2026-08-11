import { z } from 'zod';

export const updateBusinessSchema = z.object({
  name: z.string().min(2, { message: 'Nama bisnis minimal 2 karakter' }).optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: 'Format email tidak valid' }).optional(),
  address: z.string().optional(),
  isDiscountEnabled: z.boolean().optional(),
  maxDiscount: z.number().min(0).max(100).optional(),
  maxDiscountNominal: z.number().min(0).optional(),
  discountProductIds: z.array(z.string()).optional(),
  isTaxEnabled: z.boolean().optional(),
  taxPercentage: z
    .number()
    .min(0, { message: 'Pajak (Tax percentage) tidak boleh kurang dari 0' })
    .max(100, { message: 'Pajak (Tax percentage) tidak boleh lebih dari 100' })
    .optional(),
});

export type UpdateBusinessDto = z.infer<typeof updateBusinessSchema>;
