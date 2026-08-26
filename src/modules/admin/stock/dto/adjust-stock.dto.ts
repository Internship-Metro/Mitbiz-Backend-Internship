import { z } from 'zod';

export const adjustStockSchema = z.object({
  outletId: z.string().min(1, 'Cabang (outletId) wajib dipilih'),
  productId: z.string().min(1, 'ID Produk (productId) wajib diisi'),
  type: z.enum(['IN', 'OUT', 'CORRECTION']),
  quantity: z.number().positive('Jumlah harus lebih besar dari 0').optional(), // Opsional jika isUnlimited=true
  minQuantity: z.number().min(0, 'Batas minimum stok minimal 0').optional(),
  isUnlimited: z.boolean().optional(), // Jika true, stok produk ini dianggap tidak pernah habis
  notes: z.string().min(1, 'Catatan tidak boleh kosong'),
}).superRefine((data, ctx) => {
  // Jika BUKAN unlimited, quantity WAJIB diisi
  if (!data.isUnlimited && (data.quantity === undefined || data.quantity === null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['quantity'],
      message: 'Jumlah stok wajib diisi jika stok tidak unlimited',
    });
  }
});

export type AdjustStockDto = z.infer<typeof adjustStockSchema>;
