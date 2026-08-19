import { Request, Response, NextFunction } from 'express';
import { posConfigService } from './pos-config.service';
import { sendSuccess } from '@common/utils/response.util';

export class PosConfigController {
  /**
   * GET /api/v1/pos/config
   * Ambil konfigurasi pajak untuk kebutuhan halaman kasir/POS.
   * Dapat diakses oleh Kasir (MENU_POS) dan Admin.
   */
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;

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
