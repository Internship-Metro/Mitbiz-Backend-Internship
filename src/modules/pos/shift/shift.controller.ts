import { Request, Response, NextFunction } from 'express';
import { shiftService } from './shift.service';
import { sendSuccess } from '@common/utils/response.util';

export class ShiftController {
  async openShift(req: Request, res: Response, next: NextFunction) {
    try {
      const kasirId = req.user!.userId;
      const outletId = req.user!.outletId;

      if (!outletId) {
        return sendSuccess(res, null, 'Hanya Kasir yang terikat dengan outlet yang bisa membuka shift sendiri. Gunakan fitur Force Open untuk Admin.', 403);
      }

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
      // Kasir: outletId dari token. Admin: dari query param (opsional, jika kosong = semua cabang)
      const outletId = (req.user!.outletId || (req.query.outletId as string)) ?? undefined;
      const businessId = req.user!.businessId ?? undefined;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await shiftService.getShiftHistory(outletId, businessId, page, limit);

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

  // ==========================================
  // ENDPOINT ADMIN
  // ==========================================

  async getShiftSummary(req: Request, res: Response, next: NextFunction) {
    try {
      // outletId opsional: jika tidak ada → tampil semua cabang dalam bisnis
      const outletId = (req.user!.outletId || (req.query.outletId as string)) ?? undefined;
      const businessId = req.user!.businessId ?? undefined;
      const result = await shiftService.getAdminShiftSummary(outletId, businessId);
      return sendSuccess(res, result, 'Statistik shift berhasil diambil', 200);
    } catch (error) {
      next(error);
    }
  }

  async getCashiers(req: Request, res: Response, next: NextFunction) {
    try {
      // outletId opsional: jika tidak ada → tampil kasir semua cabang dalam bisnis
      const outletId = (req.user!.outletId || (req.query.outletId as string)) ?? undefined;
      const businessId = req.user!.businessId ?? undefined;
      const result = await shiftService.getAdminCashiers(outletId, businessId);
      return sendSuccess(res, result, 'Daftar kasir berhasil diambil', 200);
    } catch (error) {
      next(error);
    }
  }

  async forceOpenShift(req: Request, res: Response, next: NextFunction) {
    try {
      const outletId = req.user!.outletId || (req.query.outletId as string) || req.body.outletId;
      if (!outletId) {
        return res.status(400).json({ success: false, message: 'Parameter outletId diperlukan' });
      }
      
      const { kasirId, openingCash, notes } = req.body;
      if (!kasirId) {
        return res.status(400).json({ success: false, message: 'kasirId diperlukan' });
      }

      // Untuk admin, kita allow openingCash null/undefined dengan default 0
      const dto = { openingCash: openingCash ?? 0, notes };
      const result = await shiftService.openShift(outletId, kasirId, dto);
      return sendSuccess(res, result, 'Shift berhasil dibuka secara paksa oleh Admin', 201);
    } catch (error) {
      next(error);
    }
  }

  async forceCloseShift(req: Request, res: Response, next: NextFunction) {
    try {
      const shiftId = req.params.id as string;
      const adminId = req.user!.userId as string;
      const { closingCash, notes } = req.body;

      // Admin tidak harus menjadi kasir pemilik shift, service akan membypass cek kasirId jika di-pass flag khusus
      const dto = { closingCash: closingCash ?? 0, notes };
      const result = await shiftService.forceCloseShiftByAdmin(shiftId, adminId, dto);
      return sendSuccess(res, result, 'Shift berhasil ditutup secara paksa oleh Admin', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const shiftController = new ShiftController();
