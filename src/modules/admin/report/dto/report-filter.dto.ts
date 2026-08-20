import { z } from 'zod';

export const reportFilterSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Format startDate tidak valid (gunakan YYYY-MM-DD)' }).optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Format endDate tidak valid (gunakan YYYY-MM-DD)' }).optional(),
  branchId: z.string().optional(),
  businessId: z.string().optional(),
  format: z.enum(['json', 'excel', 'pdf']).optional(),
});

export type ReportFilterDto = z.infer<typeof reportFilterSchema>;
