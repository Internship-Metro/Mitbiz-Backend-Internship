import { Request, Response, NextFunction } from 'express';
import { superAdminSubscriptionService } from './subscription.service';
import { sendSuccess } from '@common/utils/response.util';

export class SuperAdminSubscriptionController {
  /**
   * GET /api/v1/superadmin/subscriptions
   * Query: search?, page?, limit?
   * → Tab "Pelanggan Aktif"
   */
  async getActiveSubscribers(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page, limit } = req.query;
      const result = await superAdminSubscriptionService.getActiveSubscribers({
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });
      sendSuccess(res, result, 'Berhasil mendapatkan daftar pelanggan aktif');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/superadmin/subscriptions/per-cabang
   * Query: search?
   * → Tab "Per Cabang"
   */
  async getPerCabang(req: Request, res: Response, next: NextFunction) {
    try {
      const { search } = req.query;
      const result = await superAdminSubscriptionService.getPerCabang({
        search: search as string | undefined,
      });
      sendSuccess(res, result, 'Berhasil mendapatkan data per cabang');
    } catch (error) {
      next(error);
    }
  }
}

export const superAdminSubscriptionController = new SuperAdminSubscriptionController();
