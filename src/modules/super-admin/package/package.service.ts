import { packageRepository } from './package.repository';
import { AppError } from '@common/utils/app-error.util';
import { CreatePackageType } from './dto/create-package.dto';
import { UpdatePackageType } from './dto/update-package.dto';

export class PackageService {
  /**
   * Ambil semua paket.
   * Super Admin bisa lihat semua (aktif & nonaktif).
   * Public hanya lihat yang isActive = true.
   */
  async getAllPackages({ onlyActive = false }: { onlyActive?: boolean } = {}) {
    const packages = await packageRepository.findAll({
      isActive: onlyActive ? true : undefined,
    });

    return packages.map((pkg) => ({
      ...pkg,
      activeBusinessCount: pkg._count.subscriptions,
      _count: undefined,
    }));
  }

  /**
   * Detail satu paket berdasarkan ID
   */
  async getPackageById(id: string) {
    const pkg = await packageRepository.findById(id);

    if (!pkg) {
      throw new AppError('Paket tidak ditemukan', 404);
    }

    return {
      ...pkg,
      activeBusinessCount: pkg._count.subscriptions,
      _count: undefined,
    };
  }

  /**
   * Buat paket baru (Super Admin only)
   */
  async createPackage(data: CreatePackageType) {
    // Validasi: nama paket tidak boleh duplikat
    const existing = await packageRepository.findByName(data.name);
    if (existing) {
      throw new AppError(`Paket dengan nama "${data.name}" sudah ada`, 409);
    }

    return packageRepository.create(data);
  }

  /**
   * Update paket (Super Admin only)
   */
  async updatePackage(id: string, data: UpdatePackageType) {
    const pkg = await packageRepository.findById(id);

    if (!pkg) {
      throw new AppError('Paket tidak ditemukan', 404);
    }

    // Jika nama diubah, cek duplikat nama
    if (data.name && data.name !== pkg.name) {
      const existing = await packageRepository.findByName(data.name);
      if (existing) {
        throw new AppError(`Paket dengan nama "${data.name}" sudah ada`, 409);
      }
    }

    return packageRepository.update(id, data);
  }

  /**
   * Hapus paket (Super Admin only).
   * Jika ada bisnis aktif yang memakai paket ini, hanya nonaktifkan (isActive = false).
   * Jika tidak ada, hapus permanen.
   */
  async deletePackage(id: string) {
    const pkg = await packageRepository.findById(id);

    if (!pkg) {
      throw new AppError('Paket tidak ditemukan', 404);
    }

    const activeCount = await packageRepository.countActiveSubscriptions(id);

    if (activeCount > 0) {
      // Ada bisnis aktif yang memakai — nonaktifkan saja
      await packageRepository.deactivate(id);
      return {
        message: `Paket "${pkg.name}" dinonaktifkan karena masih digunakan oleh ${activeCount} bisnis aktif`,
      };
    }

    // Tidak ada bisnis aktif — hapus permanen
    await packageRepository.delete(id);
    return { message: `Paket "${pkg.name}" berhasil dihapus` };
  }
}

export const packageService = new PackageService();
