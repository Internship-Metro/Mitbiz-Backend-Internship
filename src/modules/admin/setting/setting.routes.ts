import { Router } from 'express';
import { adminSettingController } from './setting.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';

export const adminSettingRouter = Router();

adminSettingRouter.use(jwtAuthGuard);
adminSettingRouter.use(requirePermissions([{ menu: 'MENU_SETTING', action: 'READ' }]));

adminSettingRouter.get(
  '/business',
  adminSettingController.getSettings.bind(adminSettingController)
);

adminSettingRouter.patch(
  '/business',
  requirePermissions([{ menu: 'MENU_SETTING', action: 'UPDATE' }]),
  adminSettingController.updateSettings.bind(adminSettingController)
);
