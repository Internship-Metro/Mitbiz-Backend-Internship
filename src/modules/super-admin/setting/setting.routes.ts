import { Router } from 'express';
import { settingController } from './setting.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requireRoles } from '@common/guards/roles.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { MenuPermission } from '@prisma/client';

const settingRouter = Router();

// Endpoint pengaturan sistem hanya untuk Super Admin
settingRouter.use(jwtAuthGuard);
settingRouter.use(requireRoles('SUPER_ADMIN'));

// Walaupun cuma SUPER_ADMIN, pastikan punya permission MENU_SETTING jika diimplementasikan
settingRouter.use(requirePermissions([MenuPermission.MENU_SETTING]));

settingRouter.get('/', settingController.getSettings);
settingRouter.put('/', settingController.updateSettings);

export default settingRouter;
