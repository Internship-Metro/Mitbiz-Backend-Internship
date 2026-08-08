import { Request, Response, NextFunction } from 'express';
import { adminSettingService } from './setting.service';
import { updateBusinessSchema } from './dto/update-business.dto';
import { sendSuccess } from '@common/utils/response.util';
import { AppError } from '@common/utils/app-error.util';

export class AdminSettingController {
  /**
   * Mendapatkan profil bisnis saat ini.
   */
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user || !user.businessId) {
        throw new AppError('Anda tidak memiliki akses ke fitur ini.', 403);
      }

      const business = await adminSettingService.getSettings(user.businessId);

      sendSuccess(res, {
        message: 'Berhasil mengambil profil bisnis.',
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mengubah profil bisnis (partial update).
   */
  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user || !user.businessId) {
        throw new AppError('Anda tidak memiliki akses ke fitur ini.', 403);
      }

      const validatedData = updateBusinessSchema.parse(req.body);

      const updatedBusiness = await adminSettingService.updateSettings(
        user.businessId,
        validatedData
      );

      sendSuccess(res, {
        message: 'Pengaturan profil bisnis berhasil diperbarui.',
        data: updatedBusiness,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminSettingController = new AdminSettingController();
