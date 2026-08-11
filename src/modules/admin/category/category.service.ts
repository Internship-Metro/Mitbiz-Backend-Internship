import { categoryRepository } from './category.repository';
import { CreateCategoryType } from './dto/create-category.dto';
import { UpdateCategoryType } from './dto/update-category.dto';
import { AppError } from '@common/utils/app-error.util';

export class CategoryService {
  async getCategories(
    requesterRole: string,
    requesterBusinessId: string | null,
    options?: { page?: number; limit?: number; search?: string }
  ) {
    if (requesterRole !== 'SUPER_ADMIN' && !requesterBusinessId) {
      throw new AppError('Anda tidak memiliki akses bisnis', 403);
    }
    
    const categories = await categoryRepository.findAll(requesterBusinessId ?? '', options);
    
    // Transform data to map _count.products to productCount
    const transformedData = categories.data.map(cat => ({
      id: cat.id,
      name: cat.name,
      productCount: (cat as any)._count?.products || 0,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    return {
      data: transformedData,
      total: categories.total
    };
  }

  async getCategoryById(id: string, requesterRole: string, requesterBusinessId: string | null) {
    if (requesterRole !== 'SUPER_ADMIN' && !requesterBusinessId) {
      throw new AppError('Anda tidak memiliki akses bisnis', 403);
    }

    const category = await categoryRepository.findById(id, requesterBusinessId ?? '');
    
    if (!category) {
      throw new AppError('Kategori tidak ditemukan', 404);
    }

    return category;
  }

  async createCategory(
    data: CreateCategoryType, 
    requesterRole: string, 
    requesterBusinessId: string | null
  ) {
    if (requesterRole !== 'SUPER_ADMIN' && !requesterBusinessId) {
      throw new AppError('Anda tidak memiliki akses bisnis', 403);
    }

    // Cek apakah nama kategori sudah ada di bisnis tersebut
    const existingCategory = await categoryRepository.findByName(requesterBusinessId ?? '', data.name);

    if (existingCategory) {
      // Kalau yang ditemukan adalah kategori yang sudah di-soft delete,
      // PULIHKAN saja (restore) daripada blokir user.
      if (existingCategory.deletedAt !== null) {
        return categoryRepository.restore(existingCategory.id);
      }

      // Kalau masih aktif, baru tolak dengan pesan jelas.
      throw new AppError(`Nama kategori "${data.name}" sudah ada. Gunakan nama lain.`, 409);
    }

    return categoryRepository.create(requesterBusinessId ?? '', data);
  }

  async updateCategory(
    id: string, 
    data: UpdateCategoryType,
    requesterRole: string,
    requesterBusinessId: string | null
  ) {
    if (requesterRole !== 'SUPER_ADMIN' && !requesterBusinessId) {
      throw new AppError('Anda tidak memiliki akses bisnis', 403);
    }

    // 1. Pastikan kategori milik bisnis ini dan dia berhak akses
    await this.getCategoryById(id, requesterRole, requesterBusinessId);

    // 2. Jika nama diubah, pastikan tidak bentrok dengan kategori lain
    if (data.name) {
      const existingCategory = await categoryRepository.findByName(requesterBusinessId ?? '', data.name);
      if (existingCategory && existingCategory.id !== id) {
        throw new AppError('Nama kategori sudah digunakan', 400);
      }
    }

    return categoryRepository.update(id, data);
  }

  async deleteCategory(
    id: string, 
    requesterRole: string,
    requesterBusinessId: string | null
  ) {
    if (requesterRole !== 'SUPER_ADMIN' && !requesterBusinessId) {
      throw new AppError('Anda tidak memiliki akses bisnis', 403);
    }

    // 1. Pastikan kategori milik bisnis ini dan berhak diakses
    await this.getCategoryById(id, requesterRole, requesterBusinessId);
    
    return categoryRepository.softDelete(id);
  }
}

export const categoryService = new CategoryService();
