import { Router } from 'express';
import { posConfigController } from './pos-config.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';

const router = Router();

router.use(jwtAuthGuard);

/**
 * GET /api/v1/pos/config
 * Ambil konfigurasi pajak untuk halaman POS.
 * Kasir (MENU_POS READ) dan Admin/Staff dengan MENU_SETTING READ bisa akses.
 */
router.get(
  '/config',
  requirePermissions([
    { menu: 'MENU_POS', action: 'READ' },
    { menu: 'MENU_SETTING', action: 'READ' },
  ]),
  posConfigController.getConfig.bind(posConfigController)
);

export default router;
