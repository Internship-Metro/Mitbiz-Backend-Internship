import { Request, Response, NextFunction } from 'express';
import { roleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AppError } from '@common/utils/app-error.util';

// Helper: safely extract string from JWT field that might be string | string[]
const asString = (val: string | string[] | undefined | null): string | undefined => {
  if (!val) return undefined;
  return Array.isArray(val) ? val[0] : val;
};

export class RoleController {
  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = CreateRoleDto.parse(req.body);
      const user = req.user;
      if (!user) throw new AppError('Unauthorized', 401);

      const result = await roleService.createRole(validated, user.role as string, asString(user.businessId));
      res.status(201).json({
        success: true,
        message: 'Role berhasil dibuat',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) throw new AppError('Unauthorized', 401);

      const result = await roleService.getAllRoles(asString(user.businessId));
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) throw new AppError('Unauthorized', 401);
      const { id } = req.params;

      const result = await roleService.getRoleById(id as string, asString(user.businessId));
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = UpdateRoleDto.parse(req.body);
      const user = req.user;
      if (!user) throw new AppError('Unauthorized', 401);
      const { id } = req.params;

      const result = await roleService.updateRole(id as string, validated, user.role as string, asString(user.businessId));
      res.status(200).json({
        success: true,
        message: 'Role berhasil diubah',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) throw new AppError('Unauthorized', 401);
      const { id } = req.params;

      const result = await roleService.deleteRole(id as string, user.role as string, asString(user.businessId));
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const roleController = new RoleController();
