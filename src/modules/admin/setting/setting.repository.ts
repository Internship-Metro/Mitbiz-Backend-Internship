import { prisma } from '@/prisma/client';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from '@prisma/client';

export class AdminSettingRepository {
  /**
   * Mengambil data profil bisnis berdasarkan ID.
   */
  async getBusinessSettings(businessId: string): Promise<Business | null> {
    return prisma.business.findUnique({
      where: { id: businessId },
    });
  }

  /**
   * Memperbarui profil bisnis (partial update).
   */
  async updateBusinessSettings(
    businessId: string,
    data: UpdateBusinessDto
  ): Promise<Business> {
    return prisma.business.update({
      where: { id: businessId },
      data,
    });
  }
}

export const adminSettingRepository = new AdminSettingRepository();
