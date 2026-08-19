import { Request, Response, NextFunction } from 'express';
import { posConfigService } from './pos-config.service';
import { sendSuccess } from '@common/utils/response.util';
import { prisma } from '@/prisma/client';

export class PosConfigController {
  /**
   * GET /api/v1/pos/config
   * Ambil konfigurasi pajak untuk kebutuhan halaman kasir/POS.
   * Dapat diakses oleh Kasir (MENU_POS) dan Admin.
   */
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      let businessId = req.user!.businessId;

      // Kasir mungkin tidak punya businessId langsung di token,
      // tapi punya outletId — resolve businessId dari outlet
      if (!businessId && req.user!.outletId) {
        const outlet = await prisma.outlet.findUnique({
          where: { id: req.user!.outletId },
          select: { businessId: true },
        });
        businessId = outlet?.businessId ?? null;
      }

      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: 'User tidak terikat dengan bisnis manapun.',
        });
      }

      const result = await posConfigService.getPosConfig(businessId);
      return sendSuccess(res, result, 'Konfigurasi POS berhasil diambil', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const posConfigController = new PosConfigController();
