import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { MenuPermission } from '@prisma/client';

const dashboardRouter = Router();

// Semua role yang valid bisa mengakses endpoint ini, controller akan memisahkan logicnya.
// Tapi secara khusus kita pastikan punya jwtAuthGuard
dashboardRouter.use(jwtAuthGuard);

// Endpoint utama
dashboardRouter.get('/', dashboardController.getDashboard);

export default dashboardRouter;
