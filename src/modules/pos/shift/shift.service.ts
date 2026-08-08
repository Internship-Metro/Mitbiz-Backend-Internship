import { AppError } from '@common/utils/app-error.util';
import { shiftRepository } from './shift.repository';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { buildPaginationMeta } from '@common/utils/pagination.util';
import { PaymentMethodType } from '@prisma/client';

export class ShiftService {
  /**
   * Buka shift kasir
   */
  async openShift(outletId: string, kasirId: string, data: OpenShiftDto) {
    // 1. Cek apakah kasir ini masih punya shift aktif
    const activeShift = await shiftRepository.getActiveShift(kasirId);
    if (activeShift) {
      throw new AppError('Anda masih memiliki shift yang sedang berjalan. Tutup shift terlebih dahulu.', 400);
    }

    // 2. Buka shift baru
    return shiftRepository.openShift(outletId, kasirId, data.openingCash);
  }

  /**
   * Tutup shift kasir
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
    return shiftRepository.closeShift(shiftId, data.closingCash, data.notes);
  }

  /**
   * Ambil shift yang sedang aktif untuk kasir saat ini
   */
  async getActiveShift(kasirId: string) {
    const shift = await shiftRepository.getActiveShift(kasirId);
    if (!shift) {
      throw new AppError('Tidak ada shift yang sedang berjalan', 404);
    }
    return shift;
  }

  /**
   * Ambil riwayat shift untuk Admin, dilengkapi dengan perhitungan total transaksi dan selisih
   */
  async getShiftHistory(outletId: string, page: number, limit: number) {
    const { data, total } = await shiftRepository.findAll({ outletId, page, limit });

    // Lakukan perhitungan dinamis (on-the-fly) untuk setiap shift
    const mappedData = data.map((shift) => {
      let totalTransactionsCount = 0;
      let totalRevenue = 0;
      let cashRevenue = 0;

      // Hitung dari relasi transaksi
      shift.transactions.forEach((trx) => {
        totalTransactionsCount++;
        totalRevenue += trx.totalAmount;
        
        // Cek jika pembayarannya TUNAI
        if (trx.paymentMethod?.type === PaymentMethodType.CASH) {
          cashRevenue += trx.totalAmount;
        }
      });

      // Ekspektasi fisik di laci = Modal Awal + Total Penjualan Tunai
      const expectedDrawer = shift.openingCash + cashRevenue;

      // Selisih = Kas Akhir (Fisik) - Ekspektasi Laci
      // Jika shift belum ditutup (closingCash = null), selisih tidak dihitung
      const selisih = shift.closingCash !== null ? shift.closingCash - expectedDrawer : null;

      // Buang array transactions dari response akhir agar rapi
      const { transactions, ...shiftData } = shift;

      return {
        ...shiftData,
        summary: {
          totalTransactionsCount,
          totalRevenue,
          cashRevenue,
          expectedDrawer,
          selisih,
        },
      };
    });

    return {
      data: mappedData,
      meta: buildPaginationMeta(total, page, limit),
    };
  }
}

export const shiftService = new ShiftService();
