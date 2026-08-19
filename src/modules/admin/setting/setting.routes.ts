import { Router } from 'express';
import { adminSettingController } from './setting.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { requireActiveSubscription } from '@common/guards/subscription.guard';

export const adminSettingRouter = Router();

// Protect semua endpoint dengan JWT dan langganan aktif
adminSettingRouter.use(jwtAuthGuard, requireActiveSubscription);
// Hanya user dengan permission MENU_SETTING (dan ADMIN) yang boleh akses
adminSettingRouter.use(requirePermissions(['MENU_SETTING']));

adminSettingRouter.get(
  '/business',
  adminSettingController.getSettings.bind(adminSettingController)
);

adminSettingRouter.patch(
  '/business',
  adminSettingController.updateSettings.bind(adminSettingController)
);
