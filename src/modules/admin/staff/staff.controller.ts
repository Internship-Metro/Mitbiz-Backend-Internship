import { Request, Response, NextFunction } from 'express';
import { staffService } from './staff.service';
import { sendSuccess } from '@common/utils/response.util';

export class StaffController {
  async getAllStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { outletId, search, page, limit } = req.query;

      const result = await staffService.getAllStaff({
        requesterBusinessId: req.user!.businessId!,
        outletId: outletId as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });

      sendSuccess(res, result, 'Berhasil mendapatkan daftar staff');
    } catch (error) {
      next(error);
    }
  }

  async getStaffById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await staffService.getStaffById(
        req.params.id as string,
        req.user!.businessId!,
      );
      sendSuccess(res, user, 'Berhasil mendapatkan detail staff');
    } catch (error) {
      next(error);
    }
  }

  async createStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await staffService.createStaff(
        req.body,
        req.user!.businessId!,
      );
      sendSuccess(res, user, 'Staff berhasil dibuat', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await staffService.updateStaff(
        req.params.id as string,
        req.body,
        req.user!.businessId!,
      );
      sendSuccess(res, user, 'Data staff berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  async deleteStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await staffService.deleteStaff(
        req.params.id as string,
        req.user!.businessId!,
      );
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { newPassword } = req.body;
      const result = await staffService.resetPassword(
        req.params.id as string,
        newPassword,
        req.user!.businessId!,
      );
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const staffController = new StaffController();
