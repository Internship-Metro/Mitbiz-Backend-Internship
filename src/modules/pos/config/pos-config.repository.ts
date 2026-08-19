import { prisma } from '@/prisma/client';

export class PosConfigRepository {
  /**
   * Ambil konfigurasi pajak dan data dasar bisnis yang dibutuhkan di halaman POS.
   * Hanya return field yang relevan — tidak membocorkan data sensitif bisnis lainnya.
   */
  async getTaxConfig(businessId: string) {
    return prisma.business.findUnique({
      where: { id: businessId },
      select: {
        isTaxEnabled: true,
        taxPercentage: true,
        isDiscountEnabled: true,
        globalDiscountPercentage: true,
        globalDiscountMinPurchase: true,
      },
    });
  }
}

export const posConfigRepository = new PosConfigRepository();
