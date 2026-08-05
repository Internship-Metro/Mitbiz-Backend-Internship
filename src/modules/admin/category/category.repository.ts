import { prisma } from '@/prisma/client';
import { CreateCategoryType } from './dto/create-category.dto';
import { UpdateCategoryType } from './dto/update-category.dto';
import { Prisma } from '@prisma/client';

export class CategoryRepository {
  async findAll(branchId: string, options?: { page?: number; limit?: number; search?: string }) {
    const where: Prisma.CategoryWhereInput = {
      outletId: branchId,
      deletedAt: null, // Hanya ambil yang belum dihapus
    };

    if (options?.search) {
      where.name = {
        contains: options.search,
        mode: 'insensitive',
      };
    }

    if (options?.page && options?.limit) {
      const skip = (options.page - 1) * options.limit;
      const [data, total] = await Promise.all([
        prisma.category.findMany({
          where,
          skip,
          take: options.limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.category.count({ where }),
      ]);
      return { data, total };
    }

    const data = await prisma.category.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { data, total: data.length };
  }

  async findById(id: string, branchId: string) {
    return prisma.category.findFirst({
      where: { id, outletId: branchId, deletedAt: null },
    });
  }

  async findByName(branchId: string, name: string) {
    return prisma.category.findFirst({
      where: { 
        outletId: branchId, 
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null 
      },
    });
  }

  async create(data: CreateCategoryType) {
    return prisma.category.create({
      data: {
        name: data.name,
        outletId: data.branchId,
      },
    });
  }

  async update(id: string, data: UpdateCategoryType) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const categoryRepository = new CategoryRepository();
