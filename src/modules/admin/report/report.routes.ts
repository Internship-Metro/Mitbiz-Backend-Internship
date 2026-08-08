import { Router } from 'express';
import { reportController } from './report.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { MenuPermission } from '@prisma/client';

const reportRouter = Router();

// Semua rute report memerlukan JWT dan menu report
reportRouter.use(jwtAuthGuard);
reportRouter.use(requirePermissions([MenuPermission.MENU_REPORT]));

// Rute export harus ditaruh sebelum route dengan parameter (jika ada)
reportRouter.get('/sales/export', reportController.exportSales);
reportRouter.get('/sales', reportController.getSales);

export default reportRouter;
