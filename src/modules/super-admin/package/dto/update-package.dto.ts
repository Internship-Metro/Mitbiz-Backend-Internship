import { z } from 'zod';

export const UpdatePackageDto = z.object({
  name: z
    .string()
    .min(3, 'Nama paket minimal 3 karakter')
    .max(100, 'Nama paket maksimal 100 karakter')
    .optional(),
  description: z
    .string()
    .min(10, 'Deskripsi minimal 10 karakter')
    .optional(),
  price: z
    .number()
    .int('Harga harus berupa bilangan bulat')
    .positive('Harga harus lebih dari 0')
    .optional(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(),
  maxBranches: z
    .number()
    .int()
    .positive()
    .optional(),
  maxKasir: z
    .number()
    .int()
    .positive()
    .optional(),
  isActive: z.boolean().optional(),
  features: z
    .array(z.string().min(1, 'Nama fitur tidak boleh kosong'))
    .min(1, 'Paket harus memiliki minimal 1 fitur')
    .optional(),
});

export type UpdatePackageType = z.infer<typeof UpdatePackageDto>;
