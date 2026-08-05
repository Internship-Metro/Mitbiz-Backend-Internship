import { Request, Response, NextFunction } from 'express';
import { categoryService } from './category.service';
import { createCategorySchema } from './dto/create-category.dto';
import { updateCategorySchema } from './dto/update-category.dto';

export class CategoryController {
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user pastinya ada karena rute ini dilindungi jwtAuthGuard
      const branchId = req.user!.outletId!;
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined; 
      const search = req.query.search as string | undefined;

      const result = await categoryService.getCategories(branchId, { page, limit, search });
      
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
      const branchId = req.user!.outletId!;
      const category = await categoryService.getCategoryById(req.params.id as string, branchId);
      
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
      const branchId = req.user!.outletId!;
      // Gabungkan body dengan branchId otomatis agar lebih aman (tidak bisa di-inject via JSON payload)
      const data = createCategorySchema.parse({ ...req.body, branchId });
      
      const category = await categoryService.createCategory(data);
      
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
      const branchId = req.user!.outletId!;
      const data = updateCategorySchema.parse(req.body);
      
      const category = await categoryService.updateCategory(req.params.id as string, branchId, data);
      
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
      const branchId = req.user!.outletId!;
      
      await categoryService.deleteCategory(req.params.id as string, branchId);
      
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
