import { Request, Response, NextFunction } from 'express';
import { paymentMethodService } from './payment-method.service';
import { CreatePaymentMethodSchema } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodSchema } from './dto/update-payment-method.dto';
import { successResponse } from '@common/utils/response.util';
import { AppError } from '@common/errors/AppError';

export class PaymentMethodController {
  // ==========================================
  // LEVEL BISNIS (Global)
  // ==========================================

  async getMethods(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) throw new AppError('Akses ditolak. Bisnis tidak ditemukan.', 403);

      const methods = await paymentMethodService.getMethodsByBusiness(businessId);
      return successResponse(res, methods, 'Berhasil mengambil daftar metode pembayaran');
    } catch (error) {
      next(error);
    }
  }

  async createMethod(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) throw new AppError('Akses ditolak. Bisnis tidak ditemukan.', 403);

      const dto = CreatePaymentMethodSchema.parse(req.body);
      const newMethod = await paymentMethodService.createMethod(businessId, dto);
      return successResponse(res, newMethod, 'Berhasil menambahkan metode pembayaran baru', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateMethod(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) throw new AppError('Akses ditolak.', 403);

      const methodId = req.params.id;
      const dto = UpdatePaymentMethodSchema.parse(req.body);
      
      const updatedMethod = await paymentMethodService.updateMethod(businessId, methodId, dto);
      return successResponse(res, updatedMethod, 'Berhasil memperbarui metode pembayaran');
    } catch (error) {
      next(error);
    }
  }

  async deleteMethod(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) throw new AppError('Akses ditolak.', 403);

      const methodId = req.params.id;
      const result = await paymentMethodService.deleteMethod(businessId, methodId);
      
      return successResponse(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // LEVEL CABANG (Outlet)
  // ==========================================

  async getActiveMethodsByBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const outletId = req.params.outletId;
      // Kasir & Admin bisa akses ini
      const methods = await paymentMethodService.getActiveMethodsByBranch(outletId);
      return successResponse(res, methods, 'Berhasil mengambil metode pembayaran aktif di cabang ini');
    } catch (error) {
      next(error);
    }
  }

  async activateInBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) throw new AppError('Akses ditolak.', 403);

      const outletId = req.params.outletId;
      // Gunakan req.body.paymentMethodId
      const paymentMethodId = req.body.paymentMethodId;
      
      if (!paymentMethodId) {
          throw new AppError('paymentMethodId diperlukan', 400);
      }

      const result = await paymentMethodService.activateInBranch(businessId, outletId, paymentMethodId);
      return successResponse(res, null, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  async deactivateInBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user?.businessId;
      if (!businessId) throw new AppError('Akses ditolak.', 403);

      const outletId = req.params.outletId;
      const paymentMethodId = req.params.id; // Dari path parameter DELETE /outlets/:outletId/payment-methods/:id

      const result = await paymentMethodService.deactivateInBranch(businessId, outletId, paymentMethodId);
      return successResponse(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentMethodController = new PaymentMethodController();
