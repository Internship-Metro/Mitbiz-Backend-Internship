import { outletRepository } from './outlet.repository';
import { AppError } from '@common/utils/app-error.util';
import { CreateOutletType } from './dto/create-outlet.dto';
import { UpdateOutletType } from './dto/update-outlet.dto';

export class OutletService {
  /**
   * Ambil semua outlet
   * - SUPER_ADMIN: bisa lihat semua outlet dari semua bisnis
   * - ADMIN/STAFF: hanya bisa lihat outlet milik bisnisnya sendiri
   */
  async getAllOutlets({
    requesterRole,
    requesterBusinessId,
    businessId,
    search,
    page = 1,
    limit = 10,
  }: {
    requesterRole: string;
    requesterBusinessId?: string | null;
    businessId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    // Tidak ada filter bawaan — SUPER_ADMIN bisa lihat semua
    let resolvedBusinessId = businessId;

    if (requesterRole !== 'SUPER_ADMIN') {
      if (!requesterBusinessId) {
        throw new AppError('Anda tidak memiliki akses bisnis', 403);
      }
      // Paksa pakai businessId dari token — tidak bisa lihat outlet bisnis lain
      // Tidak ada restriksi outletId: STAFF yang sudah punya MENU_CABANG
      // mendapat akses yang sama dengan ADMIN (semua outlet dalam bisnisnya)
      resolvedBusinessId = requesterBusinessId;
    }

    const { outlets, total } = await outletRepository.findAll({
      businessId: resolvedBusinessId,
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
   * Ambil detail satu outlet berdasarkan ID
   * ADMIN & STAFF (berizin MENU_CABANG): hanya boleh akses outlet dalam bisnisnya sendiri
   */
  async getOutletById(
    id: string,
    requesterRole: string,
    requesterBusinessId?: string | null,
  ) {
    const outlet = await outletRepository.findById(id);

    if (!outlet) {
      throw new AppError('Outlet tidak ditemukan', 404);
    }

    // Logika 3 kasta
    if (requesterRole !== 'SUPER_ADMIN') {
      // ADMIN & STAFF (berizin MENU_CABANG): hanya boleh akses outlet dalam bisnisnya
      // Tidak ada restriksi outletId — MENU_CABANG memberi akses penuh dalam bisnis
      if (outlet.businessId !== requesterBusinessId) {
        throw new AppError('Anda tidak memiliki akses ke outlet ini', 403);
      }
    }

    return outlet;
  }

  /**
   * Buat outlet baru
   * - Super Admin: wajib kirim businessId di body
   * - ADMIN/STAFF (berizin MENU_CABANG): otomatis pakai businessId dari token
   */
  async createOutlet(
    data: CreateOutletType,
    requesterRole: string,
    requesterBusinessId?: string | null,
  ) {
    let resolvedBusinessId = data.businessId;

    if (requesterRole !== 'SUPER_ADMIN') {
      if (!requesterBusinessId) {
        throw new AppError('Anda tidak memiliki akses bisnis untuk membuat outlet', 403);
      }
      resolvedBusinessId = requesterBusinessId; // Timpa dengan ID milik user yang request
    } else {
      if (!resolvedBusinessId) {
        throw new AppError('Super Admin wajib menyertakan businessId', 400);
      }
    }

    // Pastikan bisnis yang dituju ada dan tidak dihapus
    const business = await outletRepository.findBusinessById(resolvedBusinessId);
    if (!business) {
      throw new AppError('Bisnis tidak ditemukan atau sudah tidak aktif', 404);
    }

    if (business.status === 'SUSPENDED') {
      throw new AppError('Tidak bisa menambah outlet ke bisnis yang sedang dibekukan', 400);
    }

    const finalData = { ...data, businessId: resolvedBusinessId };
    return outletRepository.create(finalData as CreateOutletType);
  }

  /**
   * Update data outlet
   * ADMIN & STAFF (berizin MENU_CABANG): hanya boleh update outlet dalam bisnisnya sendiri
   */
  async updateOutlet(
    id: string,
    data: UpdateOutletType,
    requesterRole: string,
    requesterBusinessId?: string | null,
  ) {
    const outlet = await outletRepository.findById(id);

    if (!outlet) {
      throw new AppError('Outlet tidak ditemukan', 404);
    }

    // Logika 3 kasta
    if (requesterRole !== 'SUPER_ADMIN') {
      // ADMIN & STAFF (berizin MENU_CABANG): hanya boleh update outlet dalam bisnisnya
      // Tidak ada restriksi outletId — MENU_CABANG memberi akses penuh dalam bisnis
      if (outlet.businessId !== requesterBusinessId) {
        throw new AppError('Anda tidak memiliki akses untuk mengubah outlet ini', 403);
      }
    }

    return outletRepository.update(id, data);
  }

  /**
   * Hapus outlet (soft delete)
   * ADMIN & STAFF (berizin MENU_CABANG): hanya boleh hapus outlet milik bisnisnya sendiri
   */
  async deleteOutlet(id: string, requesterRole: string, requesterBusinessId?: string | null) {
    const outlet = await outletRepository.findById(id);

    if (!outlet) {
      throw new AppError('Outlet tidak ditemukan', 404);
    }

    if (requesterRole !== 'SUPER_ADMIN' && outlet.businessId !== requesterBusinessId) {
      throw new AppError('Anda tidak memiliki akses untuk menghapus outlet ini', 403);
    }

    await outletRepository.softDelete(id);

    return { message: `Outlet "${outlet.name}" berhasil dihapus` };
  }
}

export const outletService = new OutletService();
