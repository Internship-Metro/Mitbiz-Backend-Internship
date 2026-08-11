import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/utils/app-error.util';
import { MenuPermission } from '@prisma/client';

export const requirePermissions = (requiredPermissions: MenuPermission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AppError('Unauthorized', 401);
      }

      // SUPER_ADMIN has access to all menus implicitly
      if (user.role === 'SUPER_ADMIN') {
        return next();
      }

      // ADMIN has access to semua menu KECUALI fitur yang murni khusus Kasir (MENU_POS)
      if (user.role === 'ADMIN') {
        // Jika endpoint ini HANYA membutuhkan akses MENU_POS, tolak Admin.
        // (Misalnya endpoint Buka/Tutup Shift mandiri, Kasir Dashboard, dll)
        if (requiredPermissions.length === 1 && requiredPermissions[0] === MenuPermission.MENU_POS) {
          throw new AppError('Akses ditolak. Fitur ini hanya tersedia pada modul Point of Sale (POS).', 403);
        }
        
        // Selain itu (misal butuh MENU_SHIFT atau MENU_DASHBOARD), Admin otomatis lolos
        return next();
      }

      // For STAFF, check if their role has the required permissions
      if (user.role === 'STAFF') {
        const userPermissions = user.permissions || [];
        
        const hasPermission = requiredPermissions.some((permission) => 
          userPermissions.includes(permission)
        );

        if (!hasPermission) {
          throw new AppError('Anda tidak memiliki akses (permission) ke fitur ini', 403);
        }
        
        return next();
      }

      throw new AppError('Akses ditolak', 403);
    } catch (error) {
      next(error);
    }
  };
};
