import { AppError } from '@common/utils/app-error.util';
import { adminSettingRepository } from './setting.repository';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from '@prisma/client';

export class AdminSettingService {
  /**
   * Mengambil data profil bisnis.
   */
  async getSettings(businessId: string): Promise<Business> {
    const business = await adminSettingRepository.getBusinessSettings(businessId);
    
    if (!business) {
      throw new AppError('Data bisnis tidak ditemukan.', 404);
    }
    
    return business;
  }

  /**
   * Mengupdate data profil bisnis.
   */
  async updateSettings(
    businessId: string,
    data: UpdateBusinessDto
  ): Promise<Business> {
    // Cek apakah bisnis ada
    await this.getSettings(businessId);

    // Update
    return adminSettingRepository.updateBusinessSettings(businessId, data);
  }
}

export const adminSettingService = new AdminSettingService();
