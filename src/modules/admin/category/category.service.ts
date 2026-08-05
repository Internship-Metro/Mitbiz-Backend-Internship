import { categoryRepository } from './category.repository';
import { CreateCategoryType } from './dto/create-category.dto';
import { UpdateCategoryType } from './dto/update-category.dto';
import { AppError } from '@common/utils/app-error.util';

export class CategoryService {
  async getCategories(branchId: string, options?: { page?: number; limit?: number; search?: string }) {
    return categoryRepository.findAll(branchId, options);
  }

  async getCategoryById(id: string, branchId: string) {
    const category = await categoryRepository.findById(id, branchId);
    if (!category) {
      throw new AppError('Kategori tidak ditemukan', 404);
    }
    return category;
  }

  async createCategory(data: CreateCategoryType) {
    // Cek apakah nama kategori sudah ada di cabang tersebut
    const existingCategory = await categoryRepository.findByName(data.branchId, data.name);
    if (existingCategory) {
      throw new AppError('Nama kategori sudah digunakan di cabang ini', 400);
    }

    return categoryRepository.create(data);
  }

  async updateCategory(id: string, branchId: string, data: UpdateCategoryType) {
    // 1. Pastikan kategori milik cabang ini
    await this.getCategoryById(id, branchId);

    // 2. Jika nama diubah, pastikan tidak bentrok dengan kategori lain
    if (data.name) {
      const existingCategory = await categoryRepository.findByName(branchId, data.name);
      if (existingCategory && existingCategory.id !== id) {
        throw new AppError('Nama kategori sudah digunakan', 400);
      }
    }

    return categoryRepository.update(id, data);
  }

  async deleteCategory(id: string, branchId: string) {
    // 1. Pastikan kategori milik cabang ini
    await this.getCategoryById(id, branchId);
    
    // Note: Kita bisa menambahkan pengecekan apakah kategori sedang digunakan 
    // oleh Product yang masih aktif, tapi karena ini MVP, kita biarkan bisa dihapus
    // (Produk yang kategori-nya dihapus akan tetap punya categoryId, tapi saat di-fetch join, 
    // mungkin kategorinya null/soft deleted).
    return categoryRepository.softDelete(id);
  }
}

export const categoryService = new CategoryService();
