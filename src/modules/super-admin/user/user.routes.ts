import { Router } from 'express';
import { superAdminUserController } from './user.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requireRoles } from '@common/guards/roles.guard';
import { validate } from '@common/pipes/zod-validation.pipe';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const router = Router();

// Endpoint ini eksklusif hanya untuk SUPER_ADMIN
router.use(jwtAuthGuard, requireRoles('SUPER_ADMIN'));

// PENTING: /summary dan /form-options harus SEBELUM /:id — agar tidak dianggap sebagai param ID
router.get('/summary', superAdminUserController.getUserSummary);

// Endpoint untuk mengambil opsi dropdown (custom roles + outlets) berdasar businessId
// Dipakai form "Tambah User STAFF" di halaman Super Admin
router.get('/form-options', superAdminUserController.getFormOptions);

router.get('/', superAdminUserController.getAllUsers);
router.get('/:id', superAdminUserController.getUserById);
router.post('/', validate(CreateUserDto), superAdminUserController.createUser);
router.patch('/:id', validate(UpdateUserDto), superAdminUserController.updateUser);
router.delete('/:id', superAdminUserController.deleteUser);

export default router;
