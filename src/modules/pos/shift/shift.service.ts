import { AppError } from '@common/utils/app-error.util';
import { shiftRepository } from './shift.repository';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { buildPaginationMeta } from '@common/utils/pagination.util';
import { PaymentMethodType } from '@prisma/client';

export class ShiftService {
  /**
   * Buka shift kasir (tanpa modal awal)
   */
  async openShift(outletId: string, kasirId: string, data: OpenShiftDto) {
    // 1. Cek apakah kasir ini masih punya shift aktif
    const activeShift = await shiftRepository.getActiveShift(kasirId);
    if (activeShift) {
      throw new AppError('Anda masih memiliki shift yang sedang berjalan. Tutup shift terlebih dahulu.', 400);
    }

    // 2. Buka shift baru
    return shiftRepository.openShift(outletId, kasirId, data.notes);
  }

  /**
   * Tutup shift kasir (tanpa closing cash)
   */
  async closeShift(shiftId: string, kasirId: string, data: CloseShiftDto) {
    // 1. Cek ketersediaan shift
    const shift = await shiftRepository.findById(shiftId);
    if (!shift) {
      throw new AppError('Shift tidak ditemukan', 404);
    }

    // 2. Validasi otoritas: hanya kasir yang bersangkutan yang bisa tutup
    if (shift.kasirId !== kasirId) {
      throw new AppError('Anda tidak berhak menutup shift milik kasir lain', 403);
    }

    // 3. Validasi status: tidak bisa tutup shift yang sudah ditutup
    if (shift.closedAt) {
      throw new AppError('Shift ini sudah ditutup', 400);
    }

    // 4. Proses tutup shift
    return shiftRepository.closeShift(shiftId, data.notes);
  }

  /**
   * Ambil shift yang sedang aktif untuk kasir saat ini
   * Menghitung: Uang Masuk Hari Ini, Total Pajak, Total Transaksi
   */
  async getActiveShift(kasirId: string) {
    const shift = await shiftRepository.getActiveShift(kasirId);
    if (!shift) {
      throw new AppError('Tidak ada shift yang sedang berjalan', 404);
    }

    let totalTransactionsCount = 0;
    let totalRevenue = 0;
    let cashRevenue = 0;
    let totalTax = 0;

    shift.transactions?.forEach((trx: any) => {
      totalTransactionsCount++;
      totalRevenue += trx.totalAmount;
      totalTax += trx.taxAmount;

      if (trx.paymentMethod?.type === PaymentMethodType.CASH) {
        cashRevenue += trx.totalAmount;
      }
    });

    const { transactions, ...shiftData } = shift;

    return {
      ...shiftData,
      summary: {
        totalTransactionsCount,
        totalRevenue,   // Uang Masuk: total semua transaksi COMPLETED di shift ini
        cashRevenue,
        totalTax,
      }
    };
  }

  /**
   * Ambil riwayat shift untuk Admin, dilengkapi dengan perhitungan total transaksi
   */
  async getShiftHistory(outletId: string | undefined, businessId: string | undefined, page: number, limit: number) {
    const { data, total } = await shiftRepository.findAll({ outletId, businessId, page, limit });

    // Lakukan perhitungan dinamis (on-the-fly) untuk setiap shift
    const mappedData = data.map((shift: any) => {
      let totalTransactionsCount = 0;
      let totalRevenue = 0;
      let cashRevenue = 0;
      let totalTax = 0;

      // Hitung dari relasi transaksi
      shift.transactions.forEach((trx: any) => {
        totalTransactionsCount++;
        totalRevenue += trx.totalAmount;
        totalTax += trx.taxAmount;

        // Cek jika pembayarannya TUNAI
        if (trx.paymentMethod?.type === PaymentMethodType.CASH) {
          cashRevenue += trx.totalAmount;
        }
      });

      // Buang array transactions dari response akhir agar rapi
      const { transactions, ...shiftData } = shift;

      return {
        ...shiftData,
        summary: {
          totalTransactionsCount,
          totalRevenue,
          cashRevenue,
          totalTax,
        },
      };
    });

    return {
      data: mappedData,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  // ==========================================
  // LOGIKA KHUSUS ADMIN
  // ==========================================

  async getAdminShiftSummary(outletId?: string, businessId?: string) {
    return shiftRepository.getShiftSummaryForToday(outletId, businessId);
  }

  async getAdminCashiers(outletId?: string, businessId?: string) {
    return shiftRepository.getCashiersWithShiftStatus(outletId, businessId);
  }

  async forceCloseShiftByAdmin(shiftId: string, adminId: string, dto: CloseShiftDto) {
    // Cari shift
    const shift = await shiftRepository.findById(shiftId);
    if (!shift) {
      throw new AppError('Data shift tidak ditemukan', 404);
    }

    if (shift.closedAt) {
      throw new AppError('Shift ini sudah ditutup', 400);
    }

    // Force close: tambahkan catatan otomatis bahwa ini ditutup paksa oleh admin jika notes kosong
    const finalNotes = dto.notes || `[FORCE CLOSE OLEH ADMIN]`;

    const closedShift = await shiftRepository.closeShift(shiftId, finalNotes);
    return closedShift;
  }
}

export const shiftService = new ShiftService();
