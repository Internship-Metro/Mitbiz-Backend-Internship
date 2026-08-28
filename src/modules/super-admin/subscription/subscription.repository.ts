import { prisma } from '@/prisma/client';

export class SuperAdminSubscriptionRepository {
  /**
   * Daftar semua BusinessSubscription ACTIVE lintas bisnis.
   * Untuk tab "Pelanggan Aktif" di halaman Super Admin.
   */
  async findAllActive({
    search,
    page,
    limit,
  }: {
    search?: string;
    page: number;
    limit: number;
  }) {
    const skip = (page - 1) * limit;

    const where = {
      status: 'ACTIVE' as const,
      ...(search && {
        business: {
          name: { contains: search, mode: 'insensitive' as const },
        },
      }),
    };

    const [total, subscriptions] = await Promise.all([
      prisma.businessSubscription.count({ where }),
      prisma.businessSubscription.findMany({
        where,
        skip,
        take: limit,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              // Owner = user ADMIN pertama dari bisnis ini
              users: {
                where: { role: 'ADMIN', deletedAt: null },
                select: { name: true },
                take: 1,
                orderBy: { createdAt: 'asc' },
              },
            },
          },
          package: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, subscriptions };
  }

  /**
   * Daftar bisnis dengan info cabang per paket.
   * Untuk tab "Per Cabang" di halaman Super Admin.
   */
  async findPerCabang({ search }: { search?: string }) {
    // Ambil semua bisnis yang punya langganan ACTIVE
    const businesses = await prisma.business.findMany({
      where: {
        deletedAt: null,
        ...(search && {
          name: { contains: search, mode: 'insensitive' as const },
        }),
        subscriptions: {
          some: { status: 'ACTIVE' },
        },
      },
      select: {
        id: true,
        name: true,
        // Hitung outlet aktif (belum dihapus)
        _count: {
          select: { outlets: { where: { deletedAt: null } } },
        },
        // Ambil langganan aktif untuk dapatkan nama paket & maxBranches
        subscriptions: {
          where: { status: 'ACTIVE' },
          select: {
            package: {
              select: { name: true, maxBranches: true },
            },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return businesses;
  }
}

export const superAdminSubscriptionRepository = new SuperAdminSubscriptionRepository();
