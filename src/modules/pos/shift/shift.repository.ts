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
            discountAmount: true,
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
   * Buka shift baru
   */
  async openShift(outletId: string, kasirId: string, openingCash: number): Promise<Shift> {
    return prisma.shift.create({
      data: {
        outletId,
        kasirId,
        openingCash,
      },
    });
  }

  /**
   * Tutup shift (Update closedAt dan hasil kas akhir)
   */
  async closeShift(id: string, closingCash: number, notes?: string): Promise<Shift> {
    return prisma.shift.update({
      where: { id },
      data: {
        closingCash,
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
    page = 1,
    limit = 10,
  }: {
    outletId: string;
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.shift.findMany({
        where: { outletId },
        skip,
        take: limit,
        orderBy: { openedAt: 'desc' },
        include: {
          kasir: {
            select: { id: true, name: true, email: true },
          },
          transactions: {
            where: {
              status: 'COMPLETED', // Hanya hitung transaksi yang selesai
            },
            select: {
              totalAmount: true,
              discountAmount: true,
              taxAmount: true,
              paymentMethod: {
                select: { type: true },
              },
            },
          },
        },
      }),
      prisma.shift.count({
        where: { outletId },
      }),
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
   */
  async getShiftSummaryForToday(outletId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Hitung shift yang saat ini sedang aktif (closedAt = null)
    const activeShiftsCount = await prisma.shift.count({
      where: { outletId, closedAt: null },
    });

    // Hitung semua shift yang dibuat hari ini (mulai jam 00:00)
    const todayShiftsCount = await prisma.shift.count({
      where: { outletId, openedAt: { gte: today } },
    });

    // Hitung total penjualan hari ini dari transaksi yang COMPLETED
    const todayTransactions = await prisma.transaction.aggregate({
      where: { 
        outletId, 
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
   */
  async getCashiersWithShiftStatus(outletId: string) {
    // Ambil user yang rolenya STAFF dan terikat di outlet ini
    const cashiers = await prisma.user.findMany({
      where: { 
        outletId, 
        role: 'STAFF', 
        status: 'ACTIVE',
        customRole: {
          permissions: { has: MenuPermission.MENU_POS }
        }
      },
      select: {
        id: true,
        name: true,
        shifts: {
          where: { closedAt: null }, // Cek apakah ada shift aktif
          select: { id: true, openedAt: true },
          take: 1,
        },
      },
    });

    return cashiers.map((cashier) => ({
      id: cashier.id,
      name: cashier.name,
      activeShiftId: cashier.shifts.length > 0 ? cashier.shifts[0].id : null,
      activeShiftOpenedAt: cashier.shifts.length > 0 ? cashier.shifts[0].openedAt : null,
      status: cashier.shifts.length > 0 ? 'Sedang Bertugas' : 'Tidak Ada Shift Aktif',
    }));
  }
}

export const shiftRepository = new ShiftRepository();
