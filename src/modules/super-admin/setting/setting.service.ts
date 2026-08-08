import { settingRepository } from './setting.repository';
import { UpdateSettingDto } from './dto/update-setting.dto';

export const settingService = {
  async getSettings() {
    return settingRepository.getSettings();
  },

  async updateSettings(data: UpdateSettingDto) {
    return settingRepository.updateSettings(data);
  },
};
