import { z } from 'zod';

export const getStocksQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  outletId: z.string().optional(),
  lowStockOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  page: z.preprocess(
    (a) => (a ? parseInt(a as string, 10) : undefined),
    z.number().positive().default(1)
  ).optional(),
  limit: z.preprocess(
    (a) => (a ? parseInt(a as string, 10) : undefined),
    z.number().positive().default(10)
  ).optional(),
});

export type GetStocksQueryDto = z.infer<typeof getStocksQuerySchema>;

export const getStockAdjustmentsQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  outletId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.preprocess(
    (a) => (a ? parseInt(a as string, 10) : undefined),
    z.number().positive().default(1)
  ).optional(),
  limit: z.preprocess(
    (a) => (a ? parseInt(a as string, 10) : undefined),
    z.number().positive().default(10)
  ).optional(),
});

export type GetStockAdjustmentsQueryDto = z.infer<typeof getStockAdjustmentsQuerySchema>;
