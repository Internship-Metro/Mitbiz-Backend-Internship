import { PrismaClient, Prisma, Shift, MenuPermission } from '@prisma/client';

const prisma = new PrismaClient();

export class ShiftRepository {
  /**
   * Cari shift yang sedang berjalan (aktif) milik seorang kasir
   */
  async getActiveShift(kasirId: string): Promise<any | null> {
    return prisma.shift.findFirst({
      where: {
        kasirId,
        closedAt: null, // Jika null, berarti belum ditutup (masih aktif)
      },
      include: {
        transactions: {
          where: {
            status: 'COMPLETED',
          },
          select: {
            totalAmount: true,
            taxAmount: true,
            paymentMethod: {
              select: { type: true },
            },
          },
        },
      },
    });
  }

  /**
   * Buka shift baru (tanpa opening cash)
   */
  async openShift(outletId: string, kasirId: string, notes?: string): Promise<Shift> {
    return prisma.shift.create({
      data: {
        outletId,
        kasirId,
        notes,
      },
    });
  }

  /**
   * Tutup shift (Update closedAt dan notes)
   */
  async closeShift(id: string, notes?: string): Promise<Shift> {
    return prisma.shift.update({
      where: { id },
      data: {
        notes,
        closedAt: new Date(),
      },
    });
  }

  /**
   * Ambil riwayat semua shift di sebuah cabang dengan pagination
   * Menyertakan data kasir dan daftar transaksi (untuk dihitung agregasinya nanti di Service)
   */
  async findAll({
    outletId,
    businessId,
    page = 1,
    limit = 10,
  }: {
    outletId?: string;
    businessId?: string;
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;

    // Filter: per cabang jika outletId ada, atau semua cabang dalam bisnis jika hanya businessId
    const where: any = outletId
      ? { outletId }
      : businessId
        ? { outlet: { businessId } }
        : {};

    const [data, total] = await Promise.all([
      prisma.shift.findMany({
        where,
        skip,
        take: limit,
        orderBy: { openedAt: 'desc' },
        include: {
          kasir: {
            select: { id: true, name: true, email: true },
          },
          outlet: { select: { name: true } },
          transactions: {
            where: {
              status: 'COMPLETED',
            },
            select: {
              totalAmount: true,
              taxAmount: true,
              paymentMethod: {
                select: { type: true },
              },
            },
          },
        },
      }),
      prisma.shift.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Cari shift berdasarkan ID
   */
  async findById(id: string) {
    return prisma.shift.findUnique({
      where: { id },
      include: {
        kasir: { select: { id: true, name: true } },
      },
    });
  }

  // ==========================================
  // QUERY KHUSUS ADMIN
  // ==========================================

  /**
   * Ambil statistik ringkasan shift hari ini untuk dashboard Admin
   * outletId opsional: jika ada → filter 1 cabang, jika tidak ada → filter semua cabang dalam businessId
   */
  async getShiftSummaryForToday(outletId?: string, businessId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const outletFilter: any = outletId
      ? { outletId }
      : businessId
        ? { outlet: { businessId } }
        : {};

    const txOutletFilter: any = outletId
      ? { outletId }
      : businessId
        ? { outlet: { businessId } }
        : {};

    const activeShiftsCount = await prisma.shift.count({
      where: { ...outletFilter, closedAt: null },
    });

    const todayShiftsCount = await prisma.shift.count({
      where: { ...outletFilter, openedAt: { gte: today } },
    });

    const todayTransactions = await prisma.transaction.aggregate({
      where: {
        ...txOutletFilter,
        status: 'COMPLETED',
        createdAt: { gte: today }
      },
      _sum: {
        totalAmount: true,
      },
    });

    return {
      activeShifts: activeShiftsCount,
      todayShifts: todayShiftsCount,
      todayRevenue: todayTransactions._sum.totalAmount || 0,
    };
  }

  /**
   * Ambil daftar kasir di outlet ini beserta status shift aktifnya
   * outletId opsional: jika ada → filter 1 cabang, jika tidak → semua cabang dalam bisnis
   */
  async getCashiersWithShiftStatus(outletId?: string, businessId?: string) {
    const where: any = {
      role: 'STAFF',
      status: 'ACTIVE',
      customRole: {
        permissions: { has: MenuPermission.MENU_POS }
      },
    };

    if (outletId) {
      where.outletId = outletId;
    } else if (businessId) {
      where.outlet = { businessId };
    }

    const cashiers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        outlet: { select: { id: true, name: true } },
        shifts: {
          where: { closedAt: null },
          select: { id: true, openedAt: true },
          take: 1,
        },
      },
    });

    return cashiers.map((cashier) => ({
      id: cashier.id,
      name: cashier.name,
      outlet: cashier.outlet,
      activeShiftId: cashier.shifts.length > 0 ? cashier.shifts[0].id : null,
      activeShiftOpenedAt: cashier.shifts.length > 0 ? cashier.shifts[0].openedAt : null,
      status: cashier.shifts.length > 0 ? 'Sedang Bertugas' : 'Tidak Ada Shift Aktif',
    }));
  }
}

export const shiftRepository = new ShiftRepository();
