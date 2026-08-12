import { prisma } from '@/prisma/client';
import { CreateOutletType } from './dto/create-outlet.dto';
import { UpdateOutletType } from './dto/update-outlet.dto';

export class SuperAdminOutletRepository {
  /**
   * Ambil semua outlet dari semua bisnis dengan statistik:
   * - Jumlah user (pengguna)
   * - Jumlah produk
   * - Total pendapatan 30 hari terakhir
   * - Jumlah transaksi 30 hari terakhir
   */
  async findAll({
    businessId,
    search,
    page,
    limit,
  }: {
    businessId?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(businessId && { businessId }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
    };

    // Batas waktu 30 hari yang lalu
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [outlets, total] = await Promise.all([
      prisma.outlet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          business: {
            select: { id: true, name: true, businessCode: true },
          },
          _count: {
            select: {
              users: { where: { deletedAt: null } },
            },
          },
          transactions: {
            where: {
              createdAt: { gte: thirtyDaysAgo },
              status: 'COMPLETED',
            },
            select: {
              id: true,
              totalAmount: true,
            },
          },
        },
      }),
      prisma.outlet.count({ where }),
    ]);

    // Hitung agregasi per outlet
    const data = outlets.map((outlet) => {
      const revenue30d = outlet.transactions.reduce(
        (sum: number, tx: { totalAmount: bigint | number }) =>
          sum + Number(tx.totalAmount),
        0,
      );
      const transactionCount30d = outlet.transactions.length;

      // Hapus field transactions dari response (tidak perlu dikirim raw)
      const { transactions, ...outletData } = outlet;

      return {
        ...outletData,
        stats: {
          userCount: outlet._count.users,
          revenue30d,
          transactionCount30d,
        },
      };
    });

    return { outlets: data, total };
  }

  /**
   * Ambil detail satu outlet beserta daftar user yang ada di cabang tersebut
   * (sesuai desain: Nama | Role | Status)
   */
  async findById(id: string) {
    const outlet = await prisma.outlet.findFirst({
      where: { id, deletedAt: null },
      include: {
        business: {
          select: { id: true, name: true, businessCode: true },
        },
        _count: {
          select: {
            users: { where: { deletedAt: null } },
          },
        },
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            role: true,
            status: true,
            customRole: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!outlet) return null;

    // Hitung pendapatan 30 hari
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const txStats = await prisma.transaction.aggregate({
      where: {
        outletId: id,
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    return {
      ...outlet,
      stats: {
        userCount: outlet._count.users,
        revenue30d: Number(txStats._sum.totalAmount ?? 0),
        transactionCount30d: txStats._count.id,
      },
    };
  }

  /**
   * Buat outlet baru (wajib ada businessId)
   */
  async create(data: CreateOutletType) {
    return prisma.outlet.create({
      data: {
        businessId: data.businessId,
        name: data.name,
        address: data.address,
        phone: data.phone,
        status: data.status ?? 'ACTIVE',
      },
      include: {
        business: {
          select: { id: true, name: true, businessCode: true },
        },
      },
    });
  }

  /**
   * Update data outlet (partial)
   */
  async update(id: string, data: UpdateOutletType) {
    return prisma.outlet.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        business: {
          select: { id: true, name: true, businessCode: true },
        },
      },
    });
  }

  /**
   * Soft delete outlet
   */
  async softDelete(id: string) {
    return prisma.outlet.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  /**
   * Cek apakah bisnis dengan ID tersebut ada dan masih aktif
   */
  async findBusinessById(businessId: string) {
    return prisma.business.findFirst({
      where: { id: businessId, deletedAt: null },
      select: { id: true, name: true, status: true },
    });
  }
}

export const superAdminOutletRepository = new SuperAdminOutletRepository();
