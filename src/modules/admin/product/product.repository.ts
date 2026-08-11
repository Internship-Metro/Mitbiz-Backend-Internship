import { Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '@/prisma/client';

export class ProductRepository {
  async findAll(
    businessId: string,
    params: {
      page: number;
      limit: number;
      search?: string;
      categoryId?: string;
      status?: ProductStatus;
    }
  ) {
    const { page, limit, search, categoryId, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      businessId,
      deletedAt: null,
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
      ...(categoryId && { categoryId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          stocks: {
            select: {
              outletId: true,
              quantity: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string, businessId: string) {
    return prisma.product.findFirst({
      where: {
        id,
        businessId,
        deletedAt: null,
      },
      include: {
        category: true,
        stocks: true,
      },
    });
  }

  async findBySku(sku: string, businessId: string) {
    return prisma.product.findFirst({
      where: {
        sku,
        businessId,
        deletedAt: null,
      },
    });
  }

  async create(data: Prisma.ProductUncheckedCreateInput) {
    return prisma.product.create({
      data,
    });
  }

  async update(id: string, data: Prisma.ProductUncheckedUpdateInput) {
    return prisma.product.update({
      where: {
        id,
      },
      data,
    });
  }

  // Soft delete
  async delete(id: string) {
    return prisma.product.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
