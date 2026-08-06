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

router.get('/', superAdminUserController.getAllUsers);
router.get('/:id', superAdminUserController.getUserById);
router.post('/', validate(CreateUserDto), superAdminUserController.createUser);
router.patch('/:id', validate(UpdateUserDto), superAdminUserController.updateUser);
router.delete('/:id', superAdminUserController.deleteUser);

export default router;
