import { Router } from 'express';
import { shiftController } from './shift.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { requireActiveSubscription } from '@common/guards/subscription.guard';
import { MenuPermission } from '@prisma/client';

const router = Router();

router.use(jwtAuthGuard, requireActiveSubscription);

// ─── GET /api/v1/shifts ────────────────────────────────────────────────────────
router.get(
  '/',
  requirePermissions([MenuPermission.MENU_SHIFT]),
  shiftController.getAllShifts,
);

// ─── GET /api/v1/shifts/:id ────────────────────────────────────────────────────
router.get(
  '/:id',
  requirePermissions([MenuPermission.MENU_SHIFT]),
  shiftController.getShiftById,
);

export default router;
