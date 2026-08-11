import { z } from 'zod';

export const reportFilterSchema = z.object({
  startDate: z.string({ message: 'startDate is required' }).refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid startDate format' }),
  endDate: z.string({ message: 'endDate is required' }).refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid endDate format' }),
  branchId: z.string().optional(),
  businessId: z.string().optional(),
  format: z.enum(['json', 'excel', 'pdf']).optional(),
});

export type ReportFilterDto = z.infer<typeof reportFilterSchema>;
