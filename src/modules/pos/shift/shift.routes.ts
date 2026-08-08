import { Router } from 'express';
import { shiftController } from './shift.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { MenuPermission } from '@prisma/client';
import { validate } from '@common/pipes/zod-validation.pipe';
import { openShiftSchema } from './dto/open-shift.dto';
import { closeShiftSchema } from './dto/close-shift.dto';

const router = Router();

// Semua route di bawah ini wajib login
router.use(jwtAuthGuard);

/**
 * @route POST /api/v1/shifts/open
 * @desc Buka shift baru untuk kasir
 * @access KASIR (MENU_POS)
 */
router.post(
  '/open',
  requirePermissions([MenuPermission.MENU_POS]),
  validate(openShiftSchema),
  shiftController.openShift.bind(shiftController)
);

/**
 * @route GET /api/v1/shifts/active
 * @desc Ambil data shift yang sedang berjalan (aktif)
 * @access KASIR (MENU_POS)
 */
router.get(
  '/active',
  requirePermissions([MenuPermission.MENU_POS]),
  shiftController.getActiveShift.bind(shiftController)
);

/**
 * @route PATCH /api/v1/shifts/:id/close
 * @desc Tutup shift yang sedang berjalan
 * @access KASIR (MENU_POS)
 */
router.patch(
  '/:id/close',
  requirePermissions([MenuPermission.MENU_POS]),
  validate(closeShiftSchema),
  shiftController.closeShift.bind(shiftController)
);

/**
 * @route GET /api/v1/shifts
 * @desc Lihat riwayat semua shift di cabang ini
 * @access ADMIN (MENU_SHIFT) atau KASIR (MENU_POS)
 */
router.get(
  '/',
  // Izinkan kasir yang punya MENU_POS ATAU admin yang punya MENU_SHIFT
  requirePermissions([MenuPermission.MENU_POS, MenuPermission.MENU_SHIFT]),
  shiftController.getShiftHistory.bind(shiftController)
);

export default router;
