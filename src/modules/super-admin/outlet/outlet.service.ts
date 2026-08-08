import { superAdminOutletRepository } from './outlet.repository';
import { AppError } from '@common/utils/app-error.util';
import { CreateOutletType } from './dto/create-outlet.dto';
import { UpdateOutletType } from './dto/update-outlet.dto';

export class SuperAdminOutletService {
  /**
   * Ambil semua outlet dari seluruh bisnis (Super Admin only)
   * Query params opsional: businessId (filter per bisnis), search, page, limit
   */
  async getAllOutlets({
    businessId,
    search,
    page = 1,
    limit = 10,
  }: {
    businessId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { outlets, total } = await superAdminOutletRepository.findAll({
      businessId,
      search,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: outlets,
      meta: { total, page, limit, totalPages },
    };
  }

  /**
   * Detail satu outlet: info lengkap + daftar user di cabang tersebut
   */
  async getOutletById(id: string) {
    const outlet = await superAdminOutletRepository.findById(id);

    if (!outlet) {
      throw new AppError('Outlet tidak ditemukan', 404);
    }

    return outlet;
  }

  /**
   * Buat outlet baru — Super Admin wajib sertakan businessId di body
   */
  async createOutlet(data: CreateOutletType) {
    // Pastikan bisnis yang dituju ada dan tidak di-suspend
    const business = await superAdminOutletRepository.findBusinessById(data.businessId);

    if (!business) {
      throw new AppError('Bisnis tidak ditemukan atau sudah tidak aktif', 404);
    }

    if (business.status === 'SUSPENDED') {
      throw new AppError('Tidak bisa menambah outlet ke bisnis yang sedang dibekukan', 400);
    }

    return superAdminOutletRepository.create(data);
  }

  /**
   * Update data outlet
   */
  async updateOutlet(id: string, data: UpdateOutletType) {
    const outlet = await superAdminOutletRepository.findById(id);

    if (!outlet) {
      throw new AppError('Outlet tidak ditemukan', 404);
    }

    return superAdminOutletRepository.update(id, data);
  }

  /**
   * Hapus outlet (soft delete)
   */
  async deleteOutlet(id: string) {
    const outlet = await superAdminOutletRepository.findById(id);

    if (!outlet) {
      throw new AppError('Outlet tidak ditemukan', 404);
    }

    await superAdminOutletRepository.softDelete(id);

    return { message: `Outlet "${outlet.name}" berhasil dihapus` };
  }
}

export const superAdminOutletService = new SuperAdminOutletService();
