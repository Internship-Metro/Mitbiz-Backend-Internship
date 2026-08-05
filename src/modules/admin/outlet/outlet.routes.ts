import { Router } from 'express';
import { outletController } from './outlet.controller';
import { validate } from '@common/pipes/zod-validation.pipe';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { MenuPermission } from '@prisma/client';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';

const router = Router();

// Semua route outlet butuh login
router.use(jwtAuthGuard);

// ─── GET /api/v1/outlets ──────────────────────────────────────────────────────
// Super Admin: lihat semua outlet dari semua bisnis
// Admin/Owner: hanya lihat outlet milik bisnis sendiri (di-filter di service)
router.get(
  '/',
  requirePermissions([MenuPermission.MENU_CABANG]),
  outletController.getAllOutlets,
);

// ─── GET /api/v1/outlets/:id ──────────────────────────────────────────────────
// Super Admin: lihat detail outlet manapun
// Admin/Owner: hanya outlet miliknya (dicek di service)
router.get(
  '/:id',
  requirePermissions([MenuPermission.MENU_CABANG]),
  outletController.getOutletById,
);

// ─── POST /api/v1/outlets ─────────────────────────────────────────────────────
// Hanya Super Admin yang boleh tambah outlet baru dari panel ini
// Admin mendapat outlet pertama otomatis saat registrasi Step 3, tapi bisa tambah cabang lain
router.post(
  '/',
  requirePermissions([MenuPermission.MENU_CABANG]),
  validate(CreateOutletDto),
  outletController.createOutlet,
);

// ─── PATCH /api/v1/outlets/:id ──────────────────────────────────────────────
// Super Admin: edit outlet manapun
// Admin/STAFF: edit outlet milik bisnisnya (dicek di service)
router.patch(
  '/:id',
  requirePermissions([MenuPermission.MENU_CABANG]),
  validate(UpdateOutletDto),
  outletController.updateOutlet,
);

// ─── DELETE /api/v1/outlets/:id ───────────────────────────────────────────────
// Super Admin: bisa hapus outlet manapun
// Admin: hanya bisa hapus outlet miliknya sendiri
router.delete(
  '/:id',
  requirePermissions([MenuPermission.MENU_CABANG]),
  outletController.deleteOutlet,
);

export default router;
