import { Request, Response, NextFunction } from 'express';
import { shiftService } from './shift.service';
import { sendSuccess } from '@common/utils/response.util';

export class ShiftController {
  async openShift(req: Request, res: Response, next: NextFunction) {
    try {
      const kasirId = req.user!.userId;
      const outletId = req.user!.outletId!; // Karena kasir pasti punya outletId

      const result = await shiftService.openShift(outletId, kasirId, req.body);
      return sendSuccess(res, result, 'Shift berhasil dibuka', 201);
    } catch (error) {
      next(error);
    }
  }

  async closeShift(req: Request, res: Response, next: NextFunction) {
    try {
      const shiftId = req.params.id as string;
      const kasirId = req.user!.userId;

      const result = await shiftService.closeShift(shiftId, kasirId, req.body);
      return sendSuccess(res, result, 'Shift berhasil ditutup', 200);
    } catch (error) {
      next(error);
    }
  }

  async getActiveShift(req: Request, res: Response, next: NextFunction) {
    try {
      const kasirId = req.user!.userId;

      const result = await shiftService.getActiveShift(kasirId);
      return sendSuccess(res, result, 'Data shift aktif berhasil diambil', 200);
    } catch (error) {
      next(error);
    }
  }

  async getShiftHistory(req: Request, res: Response, next: NextFunction) {
    try {
      // Kasir akan melihat shift history di outletnya sendiri, Admin juga melihat outletnya
      const outletId = req.user!.outletId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await shiftService.getShiftHistory(outletId, page, limit);
      
      return res.status(200).json({
        success: true,
        message: 'Riwayat shift berhasil diambil',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const shiftController = new ShiftController();
