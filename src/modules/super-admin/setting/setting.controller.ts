import { Request, Response } from 'express';
import { settingService } from './setting.service';
import { updateSettingSchema } from './dto/update-setting.dto';
import { sendSuccess, sendError } from '@common/utils/response.util';

export const settingController = {
  async getSettings(req: Request, res: Response) {
    try {
      const data = await settingService.getSettings();
      return sendSuccess(res, data, 'Berhasil mengambil pengaturan sistem', 200);
    } catch (error: any) {
      return sendError(res, error.message || 'Terjadi kesalahan saat mengambil pengaturan', 500);
    }
  },

  async updateSettings(req: Request, res: Response) {
    try {
      const parsedBody = updateSettingSchema.safeParse(req.body);

      if (!parsedBody.success) {
        return sendError(res, (parsedBody.error as any)?.errors[0]?.message || 'Invalid body', 400);
      }

      const data = await settingService.updateSettings(parsedBody.data);
      return sendSuccess(res, data, 'Berhasil mengupdate pengaturan sistem', 200);
    } catch (error: any) {
      return sendError(res, error.message || 'Terjadi kesalahan saat update pengaturan', 500);
    }
  },
};
