import { z } from 'zod';

export const CreatePackageDto = z.object({
  name: z
    .string()
    .min(3, 'Nama paket minimal 3 karakter')
    .max(100, 'Nama paket maksimal 100 karakter'),
  description: z
    .string()
    .min(10, 'Deskripsi minimal 10 karakter'),
  price: z
    .number()
    .int('Harga harus berupa bilangan bulat')
    .positive('Harga harus lebih dari 0'),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
  maxBranches: z
    .number()
    .int()
    .positive()
    .default(1),
  maxKasir: z
    .number()
    .int()
    .positive()
    .default(3),
  isActive: z.boolean().default(true),
  features: z
    .array(z.string().min(1, 'Nama fitur tidak boleh kosong'))
    .min(1, 'Paket harus memiliki minimal 1 fitur'),
});

export type CreatePackageType = z.infer<typeof CreatePackageDto>;
