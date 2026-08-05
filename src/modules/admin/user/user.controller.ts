import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { sendSuccess, sendError } from '@common/utils/response.util';

export class UserController {
  /**
   * GET /api/v1/users
   * Query: businessId?, outletId?, role?, search?, page?, limit?
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId, outletId, role, search, page, limit } = req.query;

      const result = await userService.getAllUsers({
        requesterRole: req.user!.role,
        requesterBusinessId: req.user!.businessId,
        requesterOutletId: req.user!.outletId,
        businessId: businessId as string | undefined,
        outletId: outletId as string | undefined,
        role: role as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });

      sendSuccess(res, result, 'Berhasil mendapatkan daftar user');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/:id
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(
        req.params.id as string,
        req.user!.role,
        req.user!.businessId,
        req.user!.outletId,
      );
      sendSuccess(res, user, 'Berhasil mendapatkan detail user');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/users
   * Super Admin: buat user di bisnis manapun
   * Admin: buat KASIR di bisnis sendiri
   */
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      // STRICT MODE: Jika bukan SUPER_ADMIN tapi sok-sokan ngirim businessId, tolak!
      if (req.user!.role !== 'SUPER_ADMIN' && req.body.businessId) {
        return sendError(res, 'Input tidak valid', 400, [{ field: 'businessId', message: 'Anda tidak perlu/diperbolehkan mengirimkan businessId' }]);
      }

      const user = await userService.createUser(
        req.body,
        req.user!.role,
        req.user!.businessId,
        req.user!.outletId,
      );
      sendSuccess(res, user, 'User berhasil dibuat', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/:id
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateUser(
        req.params.id as string,
        req.body,
        req.user!.role,
        req.user!.businessId,
        req.user!.outletId,
      );
      sendSuccess(res, user, 'User berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/users/:id
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.deleteUser(
        req.params.id as string,
        req.user!.role,
        req.user!.businessId,
        req.user!.outletId,
      );
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
