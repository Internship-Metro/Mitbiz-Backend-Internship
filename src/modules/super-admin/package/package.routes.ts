import { Router } from 'express';
import { packageController } from './package.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requireRoles } from '@common/guards/roles.guard';
import { validate } from '@common/pipes/zod-validation.pipe';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

const router = Router();

// GET / dan GET /:id — public (tidak perlu login)
router.get('/', packageController.getAllPackages);
router.get('/:id', packageController.getPackageById);

// POST, PATCH, DELETE — hanya Super Admin
router.post(
  '/',
  jwtAuthGuard,
  requireRoles('SUPER_ADMIN'),
  validate(CreatePackageDto),
  packageController.createPackage,
);

router.patch(
  '/:id',
  jwtAuthGuard,
  requireRoles('SUPER_ADMIN'),
  validate(UpdatePackageDto),
  packageController.updatePackage,
);

router.delete(
  '/:id',
  jwtAuthGuard,
  requireRoles('SUPER_ADMIN'),
  packageController.deletePackage,
);

export default router;
