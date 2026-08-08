import { Request, Response, NextFunction } from 'express';
import { superAdminOutletService } from './outlet.service';
import { sendSuccess } from '@common/utils/response.util';

export class SuperAdminOutletController {
  /**
   * GET /api/v1/superadmin/outlets
   * Query: businessId?, search?, page?, limit?
   */
  async getAllOutlets(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId, search, page, limit } = req.query;

      const result = await superAdminOutletService.getAllOutlets({
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
   * GET /api/v1/superadmin/outlets/:id
   * Detail outlet lengkap termasuk daftar user di cabang tersebut
   */
  async getOutletById(req: Request, res: Response, next: NextFunction) {
    try {
      const outlet = await superAdminOutletService.getOutletById(req.params.id as string);
      sendSuccess(res, outlet, 'Berhasil mendapatkan detail outlet');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/superadmin/outlets
   * Body: { businessId, name, address, phone?, status? }
   */
  async createOutlet(req: Request, res: Response, next: NextFunction) {
    try {
      const outlet = await superAdminOutletService.createOutlet(req.body);
      sendSuccess(res, outlet, 'Outlet berhasil dibuat', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/superadmin/outlets/:id
   * Body: { name?, address?, phone?, status? }
   */
  async updateOutlet(req: Request, res: Response, next: NextFunction) {
    try {
      const outlet = await superAdminOutletService.updateOutlet(req.params.id as string, req.body);
      sendSuccess(res, outlet, 'Outlet berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/superadmin/outlets/:id
   */
  async deleteOutlet(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await superAdminOutletService.deleteOutlet(req.params.id as string);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const superAdminOutletController = new SuperAdminOutletController();
