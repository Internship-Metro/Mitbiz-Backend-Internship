import { z } from 'zod';
import { ProductStatus } from '@prisma/client';

export const createProductSchema = z.object({
  name: z.string().min(3, 'Nama produk minimal 3 karakter'),
  sku: z.string().min(1, 'SKU wajib diisi'),
  price: z.any().transform((val, ctx) => {
    if (val === undefined || val === null || val === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Harga wajib diisi (minimal Rp 0)' });
      return z.NEVER;
    }
    const num = Number(val);
    if (isNaN(num)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Harga harus berupa angka' });
      return z.NEVER;
    }
    if (num < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Harga tidak boleh negatif' });
      return z.NEVER;
    }
    if (num > 2000000000) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Harga maksimal adalah Rp 2.000.000.000' });
      return z.NEVER;
    }
    return num;
  }),
  discount: z.preprocess(
    (val) => (val === undefined || val === '' ? undefined : Number(val)),
    z.number({ message: 'Diskon harus berupa angka' })
      .min(0, 'Diskon minimal 0%')
      .max(100, 'Diskon maksimal 100%')
      .optional()
      .default(0)
  ),
  categoryId: z.string().cuid('Kategori wajib dipilih (Format ID tidak valid)'),
  minQuantity: z.preprocess(
    (val) => (val === undefined || val === '' ? undefined : Number(val)),
    z.number({ message: 'Batas minimum stok harus berupa angka' })
      .min(0, 'Batas minimum stok minimal 0')
      .optional()
      .default(0)
  ),
  status: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.nativeEnum(ProductStatus).default(ProductStatus.ACTIVE).optional()
  ),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
