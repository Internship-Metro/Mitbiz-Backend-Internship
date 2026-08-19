import { Router } from 'express';
import { staffController } from './staff.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { validate } from '@common/pipes/zod-validation.pipe';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const router = Router();

router.use(jwtAuthGuard);

router.get('/', requirePermissions([{ menu: 'MENU_STAFF', action: 'READ' }]), staffController.getAllStaff);
router.get('/:id', requirePermissions([{ menu: 'MENU_STAFF', action: 'READ' }]), staffController.getStaffById);
router.post('/', requirePermissions([{ menu: 'MENU_STAFF', action: 'CREATE' }]), validate(CreateStaffDto), staffController.createStaff);
router.patch('/:id', requirePermissions([{ menu: 'MENU_STAFF', action: 'UPDATE' }]), validate(UpdateStaffDto), staffController.updateStaff);
router.patch('/:id/reset-password', requirePermissions([{ menu: 'MENU_STAFF', action: 'UPDATE' }]), validate(ResetPasswordDto), staffController.resetPassword);
router.delete('/:id', requirePermissions([{ menu: 'MENU_STAFF', action: 'DELETE' }]), staffController.deleteStaff);

export default router;
