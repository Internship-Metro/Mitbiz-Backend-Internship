import { Router } from 'express';
import { outletController } from './outlet.controller';
import { validate } from '@common/pipes/zod-validation.pipe';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';

const router = Router();

// Semua route outlet butuh login
router.use(jwtAuthGuard);

// ─── GET /api/v1/outlets ──────────────────────────────────────────────────────
router.get(
  '/',
  requirePermissions([{ menu: 'MENU_CABANG', action: 'READ' }]),
  outletController.getAllOutlets,
);

// ─── GET /api/v1/outlets/:id ──────────────────────────────────────────────────
router.get(
  '/:id',
  requirePermissions([{ menu: 'MENU_CABANG', action: 'READ' }]),
  outletController.getOutletById,
);

// ─── POST /api/v1/outlets ─────────────────────────────────────────────────────
router.post(
  '/',
  requirePermissions([{ menu: 'MENU_CABANG', action: 'CREATE' }]),
  validate(CreateOutletDto),
  outletController.createOutlet,
);

// ─── PATCH /api/v1/outlets/:id ──────────────────────────────────────────────
router.patch(
  '/:id',
  requirePermissions([{ menu: 'MENU_CABANG', action: 'UPDATE' }]),
  validate(UpdateOutletDto),
  outletController.updateOutlet,
);

// ─── DELETE /api/v1/outlets/:id ───────────────────────────────────────────────
router.delete(
  '/:id',
  requirePermissions([{ menu: 'MENU_CABANG', action: 'DELETE' }]),
  outletController.deleteOutlet,
);

export default router;
