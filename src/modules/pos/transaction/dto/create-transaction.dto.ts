import { z } from 'zod';
import { OrderType } from '@prisma/client';

export const createTransactionItemSchema = z.object({
  productId: z.string({ message: 'Product ID is required' }),
  quantity: z.number({ message: 'Quantity is required' }).min(1, { message: 'Quantity must be at least 1' }),
});

export const createTransactionSchema = z.object({
  orderType: z.nativeEnum(OrderType, { message: 'Order type must be DINE_IN or TAKE_AWAY' }),
  customerName: z.string().optional(),
  tableNumber: z.string().optional(),
  paymentMethodId: z.string().optional(), // Optional jika status PENDING (Open Bill)
  amountPaid: z.number().min(0, { message: 'Amount paid cannot be negative' }).max(1000000000, { message: 'Maksimal nominal adalah 1 Miliar' }).optional(),
  notes: z.string().optional(),
  items: z.array(createTransactionItemSchema).min(1, { message: 'At least one item is required' }),
}).superRefine((data, ctx) => {
  if (data.orderType === 'DINE_IN') {
    if (!data.customerName || data.customerName.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nama pelanggan wajib diisi untuk pesanan Dine In',
        path: ['customerName'],
      });
    }
    if (!data.tableNumber || data.tableNumber.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nomor meja wajib diisi untuk pesanan Dine In',
        path: ['tableNumber'],
      });
    }
  }

  if (data.orderType === 'TAKE_AWAY') {
    if (!data.customerName || data.customerName.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nama pelanggan wajib diisi untuk pesanan Take Away',
        path: ['customerName'],
      });
    }
  }
});

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type CreateTransactionItemDto = z.infer<typeof createTransactionItemSchema>;
