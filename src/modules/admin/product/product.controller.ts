import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service';
import { createProductSchema } from './dto/create-product.dto';
import { updateProductSchema } from './dto/update-product.dto';
import { sendSuccess } from '@common/utils/response.util';
import { ProductStatus } from '@prisma/client';

export class ProductController {
  private service = new ProductService();

  getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = req.user!.outletId!;
      const { page, limit, search, categoryId, status } = req.query;

      const result = await this.service.getAllProducts(outletId, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        categoryId: categoryId as string,
        status: status as ProductStatus,
      });

      const { data, total, page: currentPage, limit: currentLimit } = result;
      res.status(200).json({
        success: true,
        message: 'Berhasil mengambil daftar produk',
        data,
        meta: { total, page: currentPage, limit: currentLimit, totalPages: Math.ceil(total / currentLimit) }
      });
    } catch (error) {
      next(error);
    }
  };

  getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = req.user!.outletId!;
      const id = req.params.id as string;

      const product = await this.service.getProductById(id, outletId);

      sendSuccess(res, product, 'Berhasil mengambil detail produk');
    } catch (error) {
      next(error);
    }
  };

  createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = req.user!.outletId!;
      
      // Parse with Zod. Because form-data sends everything as string, 
      // Zod's coerce.number() inside the schema will handle price and discount conversion.
      const validatedData = createProductSchema.parse(req.body);

      const product = await this.service.createProduct(outletId, validatedData, req.file);

      sendSuccess(res, product, 'Berhasil membuat produk', 201);
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = req.user!.outletId!;
      const id = req.params.id as string;

      const validatedData = updateProductSchema.parse(req.body);

      const product = await this.service.updateProduct(id, outletId, validatedData, req.file);

      sendSuccess(res, product, 'Berhasil memperbarui produk');
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = req.user!.outletId!;
      const id = req.params.id as string;

      await this.service.deleteProduct(id, outletId);

      sendSuccess(res, null, 'Berhasil menghapus produk');
    } catch (error) {
      next(error);
    }
  };
}
