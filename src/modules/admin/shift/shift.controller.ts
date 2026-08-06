import { Request, Response, NextFunction } from 'express';
import { shiftService } from './shift.service';
import { sendSuccess } from '@common/utils/response.util';

export class ShiftController {
  async getAllShifts(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId, outletId, kasirId, isActive, page, limit } = req.query;

      const result = await shiftService.getAllShifts({
        requesterRole: req.user!.role,
        requesterBusinessId: req.user!.businessId,
        businessId: businessId as string | undefined,
        outletId: outletId as string | undefined,
        kasirId: kasirId as string | undefined,
        isActive: isActive as string | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });

      sendSuccess(res, result, 'Berhasil mendapatkan daftar shift');
    } catch (error) {
      next(error);
    }
  }

  async getShiftById(req: Request, res: Response, next: NextFunction) {
    try {
      const shift = await shiftService.getShiftById(
        req.params.id as string,
        req.user!.role,
        req.user!.businessId,
      );
      sendSuccess(res, shift, 'Berhasil mendapatkan detail shift');
    } catch (error) {
      next(error);
    }
  }
}

export const shiftController = new ShiftController();
