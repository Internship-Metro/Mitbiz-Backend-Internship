import { AppError } from '@common/utils/app-error.util';
import { posConfigRepository } from './pos-config.repository';

export class PosConfigService {
  /**
   * Ambil konfigurasi yang dibutuhkan kasir di halaman POS:
   * - Apakah pajak aktif
   * - Persentase pajak
   *
   * businessId diambil dari JWT token (sudah divalidasi oleh guard).
   */
  async getPosConfig(businessId: string) {
    const config = await posConfigRepository.getTaxConfig(businessId);

    if (!config) {
      throw new AppError('Data konfigurasi bisnis tidak ditemukan.', 404);
    }

    return {
      tax: {
        isEnabled: config.isTaxEnabled,
        percentage: config.taxPercentage ?? 0,
      },
    };
  }
}

export const posConfigService = new PosConfigService();
