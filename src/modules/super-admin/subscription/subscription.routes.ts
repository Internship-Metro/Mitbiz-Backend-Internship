import { Router } from 'express';
import { superAdminSubscriptionController } from './subscription.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requireRoles } from '@common/guards/roles.guard';

const router = Router();

// Semua endpoint hanya untuk SUPER_ADMIN
router.use(jwtAuthGuard, requireRoles('SUPER_ADMIN'));

// PENTING: /per-cabang harus SEBELUM /:id supaya tidak dianggap param
router.get('/per-cabang', superAdminSubscriptionController.getPerCabang);
router.get('/', superAdminSubscriptionController.getActiveSubscribers);

export default router;
