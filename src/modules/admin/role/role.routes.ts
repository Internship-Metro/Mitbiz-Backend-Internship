import { Router } from 'express';
import { roleController } from './role.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requireRoles } from '@common/guards/roles.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { MenuPermission } from '@prisma/client';

const router = Router();

// Semua route di bawah ini mewajibkan user login
router.use(jwtAuthGuard);

// Mendapatkan semua role untuk bisnis (Biasanya dipakai untuk dropdown pilih role saat buat user)
// Siapapun yang punya MENU_STAFF (bisa Admin/Super Admin/Staff berwenang) boleh akses
router.get('/', requirePermissions([MenuPermission.MENU_STAFF]), roleController.getAllRoles);

// Mendapatkan daftar semua permission yang tersedia
router.get('/permissions', requirePermissions([MenuPermission.MENU_STAFF]), roleController.getAvailablePermissions);

// Mendapatkan detail role
router.get('/:id', requirePermissions([MenuPermission.MENU_STAFF]), roleController.getRoleById);

// -------------------------------------------------------------
// Hanya ADMIN dan SUPER_ADMIN yang BISA MEMBUAT/MENGUBAH ROLE
// -------------------------------------------------------------
router.use(requireRoles('SUPER_ADMIN', 'ADMIN'));

router.post('/', roleController.createRole);
router.patch('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

export default router;
