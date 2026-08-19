import { Router } from 'express';
import { shiftController } from './shift.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { validate } from '@common/pipes/zod-validation.pipe';
import { openShiftSchema } from './dto/open-shift.dto';
import { closeShiftSchema } from './dto/close-shift.dto';

const router = Router();

router.use(jwtAuthGuard);

// Kasir: buka shift
router.post(
  '/open',
  requirePermissions([{ menu: 'MENU_POS', action: 'CREATE' }]),
  validate(openShiftSchema),
  shiftController.openShift.bind(shiftController)
);

// Kasir: shift aktif saat ini
router.get(
  '/active',
  requirePermissions([{ menu: 'MENU_POS', action: 'READ' }]),
  shiftController.getActiveShift.bind(shiftController)
);

// Kasir: tutup shift
router.patch(
  '/:id/close',
  requirePermissions([{ menu: 'MENU_POS', action: 'UPDATE' }]),
  validate(closeShiftSchema),
  shiftController.closeShift.bind(shiftController)
);

// Kasir (MENU_POS READ) ATAU Admin (MENU_SHIFT READ): riwayat shift
router.get(
  '/',
  requirePermissions([
    { menu: 'MENU_POS', action: 'READ' },
    { menu: 'MENU_SHIFT', action: 'READ' },
  ]),
  shiftController.getShiftHistory.bind(shiftController)
);

// Admin (MENU_SHIFT READ) ATAU Kasir (MENU_POS READ): statistik shift hari ini
router.get(
  '/summary',
  requirePermissions([
    { menu: 'MENU_SHIFT', action: 'READ' },
    { menu: 'MENU_POS', action: 'READ' },
  ]),
  shiftController.getShiftSummary.bind(shiftController)
);

// Admin: daftar kasir dan status shift
router.get(
  '/cashiers',
  requirePermissions([{ menu: 'MENU_SHIFT', action: 'READ' }]),
  shiftController.getCashiers.bind(shiftController)
);

// Admin: paksa buka shift untuk kasir
router.post(
  '/admin/force-open',
  requirePermissions([{ menu: 'MENU_SHIFT', action: 'CREATE' }]),
  shiftController.forceOpenShift.bind(shiftController)
);

// Admin: paksa tutup shift milik kasir
router.patch(
  '/:id/admin/force-close',
  requirePermissions([{ menu: 'MENU_SHIFT', action: 'UPDATE' }]),
  shiftController.forceCloseShift.bind(shiftController)
);

export default router;
