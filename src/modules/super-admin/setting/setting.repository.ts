import { prisma } from '@/prisma/client';
import { UpdateSettingDto } from './dto/update-setting.dto';

export const settingRepository = {
  async getSettings() {
    // Pastikan selalu ada minimal 1 record dengan id 'global'
    const settings = await prisma.systemSetting.findUnique({
      where: { id: 'global' },
    });

    if (!settings) {
      return prisma.systemSetting.create({
        data: {
          id: 'global',
        },
      });
    }

    return settings;
  },

  async updateSettings(data: UpdateSettingDto) {
    return prisma.systemSetting.upsert({
      where: { id: 'global' },
      update: data,
      create: {
        id: 'global',
        ...data,
      },
    });
  },
};
