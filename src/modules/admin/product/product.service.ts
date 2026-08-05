import { ProductRepository } from './product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AppError } from '@common/utils/app-error.util';
import { uploadToCloudinary } from '@common/utils/cloudinary.util';
import { prisma } from '@/prisma/client';
import { ProductStatus } from '@prisma/client';

export class ProductService {
  private repository = new ProductRepository();

  async getAllProducts(
    outletId: string,
    params: { page?: number; limit?: number; search?: string; categoryId?: string; status?: ProductStatus }
  ) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    
    return this.repository.findAll(outletId, {
      ...params,
      page,
      limit,
    });
  }

  async getProductById(id: string, outletId: string) {
    const product = await this.repository.findById(id, outletId);
    if (!product) {
      throw new AppError('Produk tidak ditemukan', 404);
    }
    return product;
  }

  async createProduct(outletId: string, data: CreateProductDto, file?: Express.Multer.File) {
    // 1. Validate SKU Uniqueness per outlet
    const existingSku = await this.repository.findBySku(data.sku, outletId);
    if (existingSku) {
      throw new AppError('SKU sudah digunakan di cabang ini', 400);
    }

    // 2. Validate Category existence if provided
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, outletId, deletedAt: null },
      });
      if (!category) {
        throw new AppError('Kategori tidak ditemukan atau bukan milik cabang ini', 404);
      }
    }

    // 3. Handle Image Upload to Cloudinary
    let imageUrl = null;
    if (file) {
      imageUrl = await uploadToCloudinary(file, 'mitbiz/products');
    }

    // 4. Create Product with initial stock 0
    return this.repository.create({
      outletId,
      name: data.name,
      sku: data.sku,
      price: data.price,
      discount: data.discount || 0,
      categoryId: data.categoryId || null,
      status: data.status || ProductStatus.ACTIVE,
      imageUrl,
      stock: {
        create: {
          outletId,
          quantity: 0,
          minQuantity: 0,
        },
      },
    });
  }

  async updateProduct(id: string, outletId: string, data: UpdateProductDto, file?: Express.Multer.File) {
    // 1. Check if product exists and belongs to outlet
    const product = await this.getProductById(id, outletId);

    // 2. Validate SKU Uniqueness if SKU is being updated
    if (data.sku && data.sku !== product.sku) {
      const existingSku = await this.repository.findBySku(data.sku, outletId);
      if (existingSku) {
        throw new AppError('SKU sudah digunakan di cabang ini', 400);
      }
    }

    // 3. Validate Category existence if provided
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, outletId, deletedAt: null },
      });
      if (!category) {
        throw new AppError('Kategori tidak ditemukan atau bukan milik cabang ini', 404);
      }
    }

    // 4. Handle Image Upload to Cloudinary (Replace old image)
    let imageUrl = product.imageUrl;
    if (file) {
      imageUrl = await uploadToCloudinary(file, 'mitbiz/products');
      // Note: We agreed not to delete the old image from Cloudinary for recovery/history purposes
    }

    // 5. Update Product
    return this.repository.update(id, {
      name: data.name,
      sku: data.sku,
      price: data.price,
      discount: data.discount,
      categoryId: data.categoryId,
      status: data.status,
      imageUrl,
    });
  }

  async deleteProduct(id: string, outletId: string) {
    // 1. Check if product exists and belongs to outlet
    await this.getProductById(id, outletId);

    // 2. Soft delete the product (image is kept in Cloudinary as per agreement)
    return this.repository.delete(id);
  }
}
