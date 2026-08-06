const { z } = require('zod');
const { ProductStatus } = require('@prisma/client');

const createProductSchema = z.object({
  name: z.string().min(3, 'Nama produk minimal 3 karakter'),
  sku: z.string().min(1, 'SKU wajib diisi'),
  price: z.any().transform((val, ctx) => {
    if (val === undefined || val === null || val === '') return z.NEVER;
    return Number(val);
  }),
  discount: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number({ message: 'Diskon harus berupa angka' })
      .min(0, 'Diskon minimal 0%')
      .max(100, 'Diskon maksimal 100%')
      .optional()
      .default(0)
  ),
  categoryId: z.string().cuid('Kategori wajib dipilih (Format ID tidak valid)'),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.ACTIVE).optional(),
});

const updateProductSchema = createProductSchema.partial();
console.log('Update result:', updateProductSchema.parse({ name: 'Nasi Goreng Modern' }));
