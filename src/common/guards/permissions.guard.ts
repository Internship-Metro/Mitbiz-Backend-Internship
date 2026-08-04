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

      // SUPER_ADMIN and ADMIN have access to all menus implicitly
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
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
