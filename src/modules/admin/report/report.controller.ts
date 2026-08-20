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
        const firstIssue = parsedQuery.error.issues?.[0];
        const errorMessage = firstIssue?.message || `Field '${String(firstIssue?.path?.[0] ?? 'unknown')}' tidak valid`;
        console.error('[Report] Validation error:', parsedQuery.error.issues);
        return sendError(res, errorMessage, 400);
      }

      // Validasi: startDate & endDate wajib untuk laporan penjualan
      if (!parsedQuery.data.startDate || !parsedQuery.data.endDate) {
        return sendError(res, 'Parameter startDate dan endDate wajib diisi (format: YYYY-MM-DD)', 400);
      }

      const startDate = new Date(parsedQuery.data.startDate);
      const endDate = new Date(parsedQuery.data.endDate);
      endDate.setHours(23, 59, 59, 999);

      const filters = {
        startDate,
        endDate,
        branchId: parsedQuery.data.branchId,
        businessId: parsedQuery.data.businessId,
      };

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
        const firstIssue = parsedQuery.error.issues?.[0];
        const errorMessage = firstIssue?.message || `Field '${String(firstIssue?.path?.[0] ?? 'unknown')}' tidak valid`;
        console.error('[Report] Export validation error:', parsedQuery.error.issues);
        return sendError(res, errorMessage, 400);
      }

      // Validasi: startDate & endDate wajib untuk export
      if (!parsedQuery.data.startDate || !parsedQuery.data.endDate) {
        return sendError(res, 'Parameter startDate dan endDate wajib diisi (format: YYYY-MM-DD)', 400);
      }

      const format = parsedQuery.data.format || 'excel';

      const startDate = new Date(parsedQuery.data.startDate);
      const endDate = new Date(parsedQuery.data.endDate);
      endDate.setHours(23, 59, 59, 999);

      const filters = {
        startDate,
        endDate,
        branchId: parsedQuery.data.branchId,
        businessId: parsedQuery.data.businessId,
      };

      const data = await reportService.getSalesData(user, filters);
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

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
        const firstIssue = parsedQuery.error.issues?.[0];
        const errorMessage = firstIssue?.message || `Field '${String(firstIssue?.path?.[0] ?? 'unknown')}' tidak valid`;
        console.error('[Report] Top products validation error:', parsedQuery.error.issues);
        return sendError(res, errorMessage, 400);
      }

      // Validasi: startDate & endDate wajib untuk laporan produk terlaris
      if (!parsedQuery.data.startDate || !parsedQuery.data.endDate) {
        return sendError(res, 'Parameter startDate dan endDate wajib diisi (format: YYYY-MM-DD)', 400);
      }

      const startDate = new Date(parsedQuery.data.startDate);
      const endDate = new Date(parsedQuery.data.endDate);
      endDate.setHours(23, 59, 59, 999);

      const filters = {
        startDate,
        endDate,
        branchId: parsedQuery.data.branchId,
        businessId: parsedQuery.data.businessId,
      };

      const data = await reportService.getTopProducts(user, filters);
      return sendSuccess(res, data, 'Berhasil mengambil laporan produk terlaris', 200);
    } catch (error: any) {
      return sendError(res, error.message || 'Terjadi kesalahan', 500);
    }
  },

  async getStocks(req: Request, res: Response) {
    try {
      const user = req.user as any;
      // Stok tidak butuh tanggal — hanya branchId & businessId yang dipakai
      const parsedQuery = reportFilterSchema.safeParse(req.query);

      if (!parsedQuery.success) {
        const firstIssue = parsedQuery.error.issues?.[0];
        const errorMessage = firstIssue?.message || `Field '${String(firstIssue?.path?.[0] ?? 'unknown')}' tidak valid`;
        console.error('[Report] Stocks validation error:', parsedQuery.error.issues);
        return sendError(res, errorMessage, 400);
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
