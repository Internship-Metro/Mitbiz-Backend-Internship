import { prisma } from '@/prisma/client';
import { CreatePackageType } from './dto/create-package.dto';
import { UpdatePackageType } from './dto/update-package.dto';

export class PackageRepository {
  /**
   * Ambil semua paket beserta fitur-fiturnya dan jumlah bisnis yang aktif memakai paket tersebut
   */
  async findAll({ isActive }: { isActive?: boolean } = {}) {
    return prisma.package.findMany({
      where: {
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        features: {
          select: { id: true, name: true },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            subscriptions: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Detail satu paket berdasarkan ID
   */
  async findById(id: string) {
    return prisma.package.findUnique({
      where: { id },
      include: {
        features: {
          select: { id: true, name: true },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            subscriptions: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });
  }

  /**
   * Cek apakah nama paket sudah digunakan (untuk validasi unik)
   */
  async findByName(name: string) {
    return prisma.package.findUnique({ where: { name } });
  }

  /**
   * Buat paket baru beserta fitur-fiturnya dalam satu transaksi
   */
  async create(data: CreatePackageType) {
    return prisma.package.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        billingCycle: data.billingCycle,
        maxBranches: data.maxBranches,
        maxKasir: data.maxKasir,
        isActive: data.isActive,
        features: {
          create: data.features.map((name) => ({ name })),
        },
      },
      include: {
        features: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Update paket (partial update).
   * Jika array 'features' dikirim, hapus yang lama dan buat yang baru.
   */
  async update(id: string, data: UpdatePackageType) {
    return prisma.package.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.billingCycle !== undefined && { billingCycle: data.billingCycle }),
        ...(data.maxBranches !== undefined && { maxBranches: data.maxBranches }),
        ...(data.maxKasir !== undefined && { maxKasir: data.maxKasir }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        // Jika features dikirim: hapus semua lama, ganti dengan yang baru
        ...(data.features !== undefined && {
          features: {
            deleteMany: {},
            create: data.features.map((name) => ({ name })),
          },
        }),
      },
      include: {
        features: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Hapus paket (hard delete — hanya bisa jika tidak ada bisnis aktif yang memakai)
   */
  async delete(id: string) {
    return prisma.package.delete({ where: { id } });
  }

  /**
   * Nonaktifkan paket (soft disable — set isActive = false)
   */
  async deactivate(id: string) {
    return prisma.package.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Hitung berapa bisnis aktif yang sedang menggunakan paket ini
   */
  async countActiveSubscriptions(packageId: string) {
    return prisma.businessSubscription.count({
      where: { packageId, status: 'ACTIVE' },
    });
  }
}

export const packageRepository = new PackageRepository();
