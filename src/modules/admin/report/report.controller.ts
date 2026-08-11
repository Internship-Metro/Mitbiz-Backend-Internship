import { Request, Response } from 'express';
import { reportService } from './report.service';
import { reportFilterSchema } from './dto/report-filter.dto';
import { sendSuccess, sendError } from '@common/utils/response.util';

export const reportController = {
  async getSales(req: Request, res: Response) {
    try {
      const user = req.user as any;
      const parsedQuery = reportFilterSchema.safeParse(req.query);

      if (!parsedQuery.success) {
        return sendError(res, (parsedQuery.error as any)?.errors?.[0]?.message || 'Invalid query', 400);
      }

      const filters = {
        startDate: new Date(parsedQuery.data.startDate),
        endDate: new Date(parsedQuery.data.endDate),
        branchId: parsedQuery.data.branchId,
        businessId: parsedQuery.data.businessId,
      };

      // Ensure endDate covers the whole day by setting to 23:59:59
      filters.endDate.setHours(23, 59, 59, 999);

      const data = await reportService.getSalesData(user, filters);
      return sendSuccess(res, data, 'Berhasil mengambil laporan', 200);
    } catch (error: any) {
      return sendError(res, error.message || 'Terjadi kesalahan', 500);
    }
  },

  async exportSales(req: Request, res: Response) {
    try {
      const user = req.user as any;
      const parsedQuery = reportFilterSchema.safeParse(req.query);

      if (!parsedQuery.success) {
        return sendError(res, (parsedQuery.error as any)?.errors?.[0]?.message || 'Invalid query', 400);
      }

      const format = parsedQuery.data.format || 'excel';

      const filters = {
        startDate: new Date(parsedQuery.data.startDate),
        endDate: new Date(parsedQuery.data.endDate),
        branchId: parsedQuery.data.branchId,
        businessId: parsedQuery.data.businessId,
      };
      filters.endDate.setHours(23, 59, 59, 999);

      const data = await reportService.getSalesData(user, filters);
      const startStr = filters.startDate.toISOString().split('T')[0];
      const endStr = filters.endDate.toISOString().split('T')[0];

      if (format === 'pdf') {
        const buffer = await reportService.generatePdfReport(data, startStr, endStr);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Laporan_Penjualan_${startStr}.pdf"`);
        return res.send(buffer);
      } else {
        const buffer = await reportService.generateExcelReport(data, startStr, endStr);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Laporan_Penjualan_${startStr}.xlsx"`);
        return res.send(buffer);
      }
    } catch (error: any) {
      return sendError(res, error.message || 'Terjadi kesalahan saat export', 500);
    }
  },

  async getTopProducts(req: Request, res: Response) {
    try {
      const user = req.user as any;
      const parsedQuery = reportFilterSchema.safeParse(req.query);

      if (!parsedQuery.success) {
        return sendError(res, (parsedQuery.error as any)?.errors?.[0]?.message || 'Invalid query', 400);
      }

      const filters = {
        startDate: new Date(parsedQuery.data.startDate),
        endDate: new Date(parsedQuery.data.endDate),
        branchId: parsedQuery.data.branchId,
        businessId: parsedQuery.data.businessId,
      };
      filters.endDate.setHours(23, 59, 59, 999);

      const data = await reportService.getTopProducts(user, filters);
      return sendSuccess(res, data, 'Berhasil mengambil laporan produk terlaris', 200);
    } catch (error: any) {
      return sendError(res, error.message || 'Terjadi kesalahan', 500);
    }
  },

  async getStocks(req: Request, res: Response) {
    try {
      const user = req.user as any;
      // We still parse the query to extract branchId, but dates are ignored for stocks
      const parsedQuery = reportFilterSchema.safeParse(req.query);

      if (!parsedQuery.success) {
        return sendError(res, (parsedQuery.error as any)?.errors?.[0]?.message || 'Invalid query', 400);
      }

      const filters = {
        branchId: parsedQuery.data.branchId,
        businessId: parsedQuery.data.businessId,
      };

      const data = await reportService.getStocks(user, filters);
      return sendSuccess(res, data, 'Berhasil mengambil laporan stok', 200);
    } catch (error: any) {
      return sendError(res, error.message || 'Terjadi kesalahan', 500);
    }
  }
};
