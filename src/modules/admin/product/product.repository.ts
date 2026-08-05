import { Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '@/prisma/client';

export class ProductRepository {
  async findAll(
    outletId: string,
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
      outletId,
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
          stock: {
            select: {
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

  async findById(id: string, outletId: string) {
    return prisma.product.findFirst({
      where: {
        id,
        outletId,
        deletedAt: null,
      },
      include: {
        category: true,
        stock: true,
      },
    });
  }

  async findBySku(sku: string, outletId: string) {
    return prisma.product.findFirst({
      where: {
        sku,
        outletId,
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
