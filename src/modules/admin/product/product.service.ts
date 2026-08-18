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
    businessId: string,
    params: { page?: number; limit?: number; search?: string; categoryId?: string; status?: ProductStatus; outletId?: string }
  ) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;

    return this.repository.findAll(businessId, {
      ...params,
      page,
      limit,
    });
  }

  async getProductById(id: string, businessId: string) {
    const product = await this.repository.findById(id, businessId);
    if (!product) {
      throw new AppError('Produk tidak ditemukan', 404);
    }
    return product;
  }

  async createProduct(businessId: string, data: CreateProductDto, file?: Express.Multer.File) {
    // 1. Validate SKU Uniqueness per business
    const existingSku = await this.repository.findBySku(data.sku, businessId);
    if (existingSku) {
      throw new AppError('SKU sudah digunakan di bisnis ini', 400);
    }

    // 2. Validate Category existence if provided
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, businessId, deletedAt: null },
      });
      if (!category) {
        throw new AppError('Kategori tidak ditemukan atau bukan milik bisnis ini', 404);
      }
    }

    // 3. Handle Image Upload to Cloudinary
    let imageUrl: string | null = null;
    if (file) {
      imageUrl = await uploadToCloudinary(file, 'mitbiz/products');
    }

    // 4. Get all outlets belonging to this business
    const outlets = await prisma.outlet.findMany({
      where: { businessId, deletedAt: null },
      select: { id: true },
    });

    // 5. Create Product + Stock records for ALL outlets in one atomic transaction
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          businessId,
          name: data.name,
          sku: data.sku,
          price: data.price,
          discount: data.discount || 0,
          categoryId: data.categoryId || null,
          status: data.status || ProductStatus.ACTIVE,
          imageUrl,
        },
      });

      // Create stock record (qty=0) for every outlet in this business
      if (outlets.length > 0) {
        await tx.stock.createMany({
          data: outlets.map((outlet) => ({
            productId: product.id,
            outletId: outlet.id,
            quantity: 0,
            minQuantity: 0,
          })),
          skipDuplicates: true,
        });
      }

      return product;
    });
  }

  async updateProduct(id: string, businessId: string, data: UpdateProductDto, file?: Express.Multer.File) {
    // 1. Check if product exists and belongs to business
    const product = await this.getProductById(id, businessId);

    // 2. Validate SKU Uniqueness if SKU is being updated
    if (data.sku && data.sku !== product.sku) {
      const existingSku = await this.repository.findBySku(data.sku, businessId);
      if (existingSku) {
        throw new AppError('SKU sudah digunakan di bisnis ini', 400);
      }
    }

    // 3. Validate Category existence if provided
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, businessId, deletedAt: null },
      });
      if (!category) {
        throw new AppError('Kategori tidak ditemukan atau bukan milik bisnis ini', 404);
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

  async deleteProduct(id: string, businessId: string) {
    // 1. Check if product exists and belongs to business
    await this.getProductById(id, businessId);

    // 2. Soft delete the product (image is kept in Cloudinary as per agreement)
    return this.repository.delete(id);
  }
}
