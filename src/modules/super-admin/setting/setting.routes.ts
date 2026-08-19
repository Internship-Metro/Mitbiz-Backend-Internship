import { Router } from 'express';
import { settingController } from './setting.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requireRoles } from '@common/guards/roles.guard';

const settingRouter = Router();

// Endpoint pengaturan sistem hanya untuk Super Admin — requireRoles sudah cukup
settingRouter.use(jwtAuthGuard);
settingRouter.use(requireRoles('SUPER_ADMIN'));

settingRouter.get('/', settingController.getSettings);
settingRouter.put('/', settingController.updateSettings);

export default settingRouter;
