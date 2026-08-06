import { Request, Response, NextFunction } from 'express';
import { superAdminUserService } from './user.service';
import { sendSuccess } from '@common/utils/response.util';

export class SuperAdminUserController {
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId, search, page, limit } = req.query;

      const result = await superAdminUserService.getAllUsers({
        businessId: businessId as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });

      sendSuccess(res, result, 'Berhasil mendapatkan daftar user');
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await superAdminUserService.getUserById(req.params.id as string);
      sendSuccess(res, user, 'Berhasil mendapatkan detail user');
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await superAdminUserService.createUser(req.body);
      sendSuccess(res, user, 'User pemilik bisnis berhasil dibuat', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await superAdminUserService.updateUser(req.params.id as string, req.body);
      sendSuccess(res, user, 'User berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await superAdminUserService.deleteUser(req.params.id as string);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const superAdminUserController = new SuperAdminUserController();
