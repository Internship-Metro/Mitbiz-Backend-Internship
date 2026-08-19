import { Router } from 'express';
import { posConfigController } from './pos-config.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';

const router = Router();

// Dilindungi JWT — bisa diakses oleh Kasir (MENU_POS) maupun Admin
router.use(jwtAuthGuard);

/**
 * GET /api/v1/pos/config
 * Ambil konfigurasi pajak untuk kebutuhan halaman kasir/POS.
 * Diakses oleh kasir (MENU_POS) dan admin bisnis.
 *
 * Kenapa dua permission di sini?
 * - MENU_POS     → kasir murni bisa akses
 * - MENU_SETTING → staff admin yang punya akses setting juga bisa akses
 * Admin (role=ADMIN) otomatis lolos karena guard hanya blokir Admin
 * jika endpoint HANYA butuh MENU_POS saja (bukan 2 permission sekaligus).
 */
router.get(
  '/config',
  requirePermissions(['MENU_POS', 'MENU_SETTING']),
  posConfigController.getConfig.bind(posConfigController)
);

export default router;
