import { PrismaClient, Prisma, Shift } from '@prisma/client';

const prisma = new PrismaClient();

export class ShiftRepository {
  /**
   * Cari shift yang sedang berjalan (aktif) milik seorang kasir
   */
  async getActiveShift(kasirId: string): Promise<Shift | null> {
    return prisma.shift.findFirst({
      where: {
        kasirId,
        closedAt: null, // Jika null, berarti belum ditutup (masih aktif)
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
}

export const shiftRepository = new ShiftRepository();
