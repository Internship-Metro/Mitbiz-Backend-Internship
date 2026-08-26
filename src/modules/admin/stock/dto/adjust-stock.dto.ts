import { z } from 'zod';

export const adjustStockSchema = z.object({
  outletId: z.string().min(1, 'Cabang (outletId) wajib dipilih'),
  productId: z.string().min(1, 'ID Produk (productId) wajib diisi'),
  type: z.enum(['IN', 'OUT', 'CORRECTION']),
  quantity: z.number().min(0).nullable().optional(), // null = unlimited, undefined = tidak dikirim
  minQuantity: z.number().min(0, 'Batas minimum stok minimal 0').optional(),
  isUnlimited: z.boolean().optional(),
  notes: z.string().min(1, 'Catatan tidak boleh kosong'),
}).superRefine((data, ctx) => {
  // Jika BUKAN unlimited: quantity WAJIB ada dan harus lebih dari 0
  if (!data.isUnlimited) {
    if (data.quantity === undefined || data.quantity === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quantity'],
        message: 'Jumlah stok wajib diisi jika stok tidak unlimited',
      });
    } else if (data.quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quantity'],
        message: 'Jumlah stok harus lebih besar dari 0',
      });
    }
  }
});

export type AdjustStockDto = z.infer<typeof adjustStockSchema>;
