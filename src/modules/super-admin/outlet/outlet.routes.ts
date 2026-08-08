import { Router } from 'express';
import { superAdminOutletController } from './outlet.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requireRoles } from '@common/guards/roles.guard';
import { validate } from '@common/pipes/zod-validation.pipe';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';

const router = Router();

// Semua endpoint di sini eksklusif hanya untuk SUPER_ADMIN
router.use(jwtAuthGuard, requireRoles('SUPER_ADMIN'));

router.get('/', superAdminOutletController.getAllOutlets);
router.get('/:id', superAdminOutletController.getOutletById);
router.post('/', validate(CreateOutletDto), superAdminOutletController.createOutlet);
router.patch('/:id', validate(UpdateOutletDto), superAdminOutletController.updateOutlet);
router.delete('/:id', superAdminOutletController.deleteOutlet);

export default router;
