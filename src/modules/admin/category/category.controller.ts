import { Request, Response, NextFunction } from 'express';
import { categoryService } from './category.service';
import { createCategorySchema } from './dto/create-category.dto';
import { updateCategorySchema } from './dto/update-category.dto';
import { AppError } from '@common/utils/app-error.util';

export class CategoryController {
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined; 
      const search = req.query.search as string | undefined;

      const result = await categoryService.getCategories(
        req.user!.role,
        req.user!.businessId ?? null,
        { page, limit, search }
      );
      
      res.status(200).json({
        success: true,
        message: 'Berhasil mengambil daftar kategori',
        data: result.data,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.getCategoryById(
        req.params.id as string, 
        req.user!.role,
        req.user!.businessId ?? null,
      );
      
      res.status(200).json({
        success: true,
        message: 'Berhasil mengambil detail kategori',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCategorySchema.parse(req.body);
      
      const category = await categoryService.createCategory(
        data,
        req.user!.role,
        req.user!.businessId ?? null,
      );
      
      res.status(201).json({
        success: true,
        message: 'Kategori berhasil dibuat',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateCategorySchema.parse(req.body);
      
      const category = await categoryService.updateCategory(
        req.params.id as string, 
        data,
        req.user!.role,
        req.user!.businessId ?? null,
      );
      
      res.status(200).json({
        success: true,
        message: 'Kategori berhasil diperbarui',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      await categoryService.deleteCategory(
        req.params.id as string, 
        req.user!.role,
        req.user!.businessId ?? null,
      );
      
      res.status(200).json({
        success: true,
        message: 'Kategori berhasil dihapus',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
