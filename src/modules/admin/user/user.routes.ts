import { Router } from 'express';
import { userController } from './user.controller';
import { validate } from '@common/pipes/zod-validation.pipe';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { MenuPermission } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const router = Router();

// Semua route user butuh login
router.use(jwtAuthGuard);

// ─── GET /api/v1/users ────────────────────────────────────────────────────────
// Super Admin: lihat semua user dari semua bisnis
// Admin: hanya user di bisnis sendiri (di-filter di service)
router.get(
  '/',
  requirePermissions([MenuPermission.MENU_STAFF]),
  userController.getAllUsers,
);

// ─── GET /api/v1/users/:id ────────────────────────────────────────────────────
router.get(
  '/:id',
  requirePermissions([MenuPermission.MENU_STAFF]),
  userController.getUserById,
);

// ─── POST /api/v1/users ───────────────────────────────────────────────────────
// Super Admin: buat user (ADMIN/KASIR/OWNER) di bisnis manapun → wajib kirim businessId
// Admin: buat KASIR di bisnis sendiri → businessId otomatis dari token
router.post(
  '/',
  requirePermissions([MenuPermission.MENU_STAFF]),
  validate(CreateUserDto),
  userController.createUser,
);

// ─── PUT /api/v1/users/:id ────────────────────────────────────────────────────
// Super Admin & Admin bisa edit user
// Admin hanya bisa edit user di bisnis sendiri (dicek di service)
router.put(
  '/:id',
  requirePermissions([MenuPermission.MENU_STAFF]),
  validate(UpdateUserDto),
  userController.updateUser,
);

// ─── DELETE /api/v1/users/:id ────────────────────────────────────────────────
// Super Admin: hapus user manapun
// Admin: hanya hapus user di bisnis sendiri (dicek di service)
router.delete(
  '/:id',
  requirePermissions([MenuPermission.MENU_STAFF]),
  userController.deleteUser,
);

export default router;
