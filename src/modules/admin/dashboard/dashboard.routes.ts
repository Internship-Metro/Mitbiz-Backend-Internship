import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { requireActiveSubscription } from '@common/guards/subscription.guard';
import { MenuPermission } from '@prisma/client';

const dashboardRouter = Router();

// Semua role yang valid bisa mengakses endpoint ini, controller akan memisahkan logicnya.
// Wajib login dan langganan aktif — dashboard tidak ada artinya tanpa data operasional
dashboardRouter.use(jwtAuthGuard, requireActiveSubscription);

// Endpoint utama
dashboardRouter.get('/', dashboardController.getDashboard);

export default dashboardRouter;
