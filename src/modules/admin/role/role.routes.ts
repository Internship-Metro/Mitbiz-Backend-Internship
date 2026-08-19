import { Router } from 'express';
import { roleController } from './role.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requireRoles } from '@common/guards/roles.guard';
import { requirePermissions } from '@common/guards/permissions.guard';

const router = Router();

router.use(jwtAuthGuard);

// READ: Siapapun yang bisa akses MENU_STAFF (untuk dropdown pilih role saat buat user)
router.get('/', requirePermissions([{ menu: 'MENU_STAFF', action: 'READ' }]), roleController.getAllRoles);

// Daftar semua menu yang tersedia (untuk render matriks di frontend)
router.get('/permissions', requirePermissions([{ menu: 'MENU_STAFF', action: 'READ' }]), roleController.getAvailablePermissions);

// Detail satu role beserta matriks permission-nya
router.get('/:id', requirePermissions([{ menu: 'MENU_STAFF', action: 'READ' }]), roleController.getRoleById);

// ─── Create/Update/Delete Role: Hanya ADMIN dan SUPER_ADMIN ─────────────────
router.use(requireRoles('SUPER_ADMIN', 'ADMIN'));

router.post('/', roleController.createRole);
router.patch('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

export default router;
