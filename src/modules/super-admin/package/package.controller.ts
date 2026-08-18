import { Request, Response, NextFunction } from 'express';
import { packageService } from './package.service';
import { sendSuccess } from '@common/utils/response.util';

export class PackageController {
  /**
   * GET /api/v1/packages
   * Public: tampilkan semua paket aktif.
   * Super Admin (dengan query ?all=true): tampilkan semua termasuk yang nonaktif.
   */
  async getAllPackages(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const isSuperAdmin = user?.role === 'SUPER_ADMIN';
      const showAll = req.query.all === 'true' && isSuperAdmin;

      const packages = await packageService.getAllPackages({
        onlyActive: !showAll,
      });

      sendSuccess(res, packages, 'Berhasil mendapatkan daftar paket');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/packages/:id
   * Detail satu paket
   */
  async getPackageById(req: Request, res: Response, next: NextFunction) {
    try {
      const pkg = await packageService.getPackageById(req.params['id'] as string);
      sendSuccess(res, pkg, 'Berhasil mendapatkan detail paket');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/packages
   * Buat paket baru (Super Admin only)
   */
  async createPackage(req: Request, res: Response, next: NextFunction) {
    try {
      const pkg = await packageService.createPackage(req.body);
      sendSuccess(res, pkg, 'Paket berhasil dibuat', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/packages/:id
   * Update paket (Super Admin only)
   */
  async updatePackage(req: Request, res: Response, next: NextFunction) {
    try {
      const pkg = await packageService.updatePackage(req.params['id'] as string, req.body);
      sendSuccess(res, pkg, 'Paket berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/packages/:id
   * Hapus atau nonaktifkan paket (Super Admin only)
   */
  async deletePackage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await packageService.deletePackage(req.params['id'] as string);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const packageController = new PackageController();
