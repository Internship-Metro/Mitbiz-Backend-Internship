import { Router } from 'express';
import { shiftController } from './shift.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';

const router = Router();

router.use(jwtAuthGuard);

// GET /api/v1/shifts — riwayat shift semua kasir (Admin view)
router.get(
  '/',
  requirePermissions([{ menu: 'MENU_SHIFT', action: 'READ' }]),
  shiftController.getAllShifts,
);

// GET /api/v1/shifts/:id — detail shift tertentu
router.get(
  '/:id',
  requirePermissions([{ menu: 'MENU_SHIFT', action: 'READ' }]),
  shiftController.getShiftById,
);

export default router;
