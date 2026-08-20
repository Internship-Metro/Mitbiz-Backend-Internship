import { z } from 'zod';

export const adjustStockSchema = z.object({
  outletId: z.string().min(1, 'Cabang (outletId) wajib dipilih'),
  productId: z.string().min(1, 'ID Produk (productId) wajib diisi'),
  type: z.enum(['IN', 'OUT', 'CORRECTION']),
  quantity: z.number().positive('Jumlah harus lebih besar dari 0'),
  minQuantity: z.number().min(0, 'Batas minimum stok minimal 0').optional(),
  notes: z.string().min(1, 'Catatan tidak boleh kosong'),
});

export type AdjustStockDto = z.infer<typeof adjustStockSchema>;
