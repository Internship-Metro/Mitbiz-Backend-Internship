import { Router } from 'express';
import { staffController } from './staff.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { validate } from '@common/pipes/zod-validation.pipe';
import { MenuPermission } from '@prisma/client';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const router = Router();

// Semua rute staff wajib login dan punya izin MENU_STAFF (Manajemen Karyawan/Staff)
router.use(jwtAuthGuard, requirePermissions([MenuPermission.MENU_STAFF]));

router.get('/', staffController.getAllStaff);
router.get('/:id', staffController.getStaffById);
router.post('/', validate(CreateStaffDto), staffController.createStaff);
router.patch('/:id', validate(UpdateStaffDto), staffController.updateStaff);
router.patch('/:id/reset-password', validate(ResetPasswordDto), staffController.resetPassword);
router.delete('/:id', staffController.deleteStaff);

export default router;
