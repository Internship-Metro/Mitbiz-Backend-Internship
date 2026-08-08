import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess, sendError } from '@common/utils/response.util';

export const dashboardController = {
  async getDashboard(req: Request, res: Response) {
    try {
      const user = req.user as any;
      const { businessId } = req.query;

      // Fitur khusus Super Admin: bisa melihat spesifik Tenant via ?businessId=
      if (user.role === 'SUPER_ADMIN' && businessId && typeof businessId === 'string') {
        const data = await dashboardService.getSuperAdminViewTenant(businessId);
        return sendSuccess(res, data, 'Berhasil mengambil dashboard tenant', 200);
      }

      // Default: ambil berdasarkan role yang login
      const data = await dashboardService.getDashboardData(user);

      return sendSuccess(res, data, 'Berhasil mengambil data dashboard', 200);
    } catch (error: any) {
      return sendError(res, error.message || 'Terjadi kesalahan pada server', 500);
    }
  },
};
