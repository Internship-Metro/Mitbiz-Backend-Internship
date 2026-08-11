import { Request, Response, NextFunction } from 'express';
import { outletService } from './outlet.service';
import { sendSuccess, sendError } from '@common/utils/response.util';

export class OutletController {
  /**
   * GET /api/v1/outlets
   * Query params: businessId?, search?, page?, limit?
   */
  async getAllOutlets(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId, search, page, limit } = req.query;

      const result = await outletService.getAllOutlets({
        requesterRole: req.user!.role,
        requesterBusinessId: req.user!.businessId,
        requesterOutletId: req.user!.outletId,
        businessId: businessId as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });

      sendSuccess(res, result, 'Berhasil mendapatkan daftar outlet');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/outlets/:id
   */
  async getOutletById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const outlet = await outletService.getOutletById(
        id as string,
        req.user!.role,
        req.user!.businessId,
        req.user!.outletId,
      );

      sendSuccess(res, outlet, 'Berhasil mendapatkan detail outlet');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/outlets
   * SUPER_ADMIN, ADMIN & STAFF (berizin MENU_CABANG)
   */
  async createOutlet(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;

      // STRICT MODE: Jika bukan SUPER_ADMIN tapi sok-sokan ngirim businessId, tolak!
      if (req.user!.role !== 'SUPER_ADMIN' && data.businessId) {
        return sendError(res, 'Input tidak valid', 400, [{ field: 'businessId', message: 'Anda tidak perlu/diperbolehkan mengirimkan businessId' }]);
      }

      const outlet = await outletService.createOutlet(
        data,
        req.user!.role,
        req.user!.businessId,
        req.user!.outletId,
      );
      sendSuccess(res, outlet, 'Outlet berhasil ditambahkan', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/outlets/:id
   * SUPER_ADMIN, ADMIN & STAFF (berizin MENU_CABANG) — semua outlet dalam bisnis
   */
  async updateOutlet(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;

      const outlet = await outletService.updateOutlet(
        id as string,
        data,
        req.user!.role,
        req.user!.businessId,
        req.user!.outletId,
      );

      sendSuccess(res, outlet, 'Outlet berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/outlets/:id
   * SUPER_ADMIN, ADMIN & STAFF (berizin MENU_CABANG)
   */
  async deleteOutlet(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await outletService.deleteOutlet(
        id as string,
        req.user!.role,
        req.user!.businessId,
        req.user!.outletId,
      );
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const outletController = new OutletController();
