import { Router } from 'express';
import { paymentMethodController } from './payment-method.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requireRoles } from '@common/guards/roles.guard';
import { UserRole } from '@prisma/client';

const router = Router();

// ==========================================
// TINGKAT BISNIS (Hanya Admin)
// ==========================================
// Endpoint: /api/v1/payment-methods

router.use('/payment-methods', jwtAuthGuard);

router.get('/payment-methods', requireRoles('ADMIN'), paymentMethodController.getMethods);
router.post('/payment-methods', requireRoles('ADMIN'), paymentMethodController.createMethod);
router.patch('/payment-methods/:id', requireRoles('ADMIN'), paymentMethodController.updateMethod);
router.delete('/payment-methods/:id', requireRoles('ADMIN'), paymentMethodController.deleteMethod);


// ==========================================
// TINGKAT CABANG / OUTLET
// ==========================================
// Endpoint: /api/v1/outlets/:outletId/payment-methods

// Bisa diakses oleh Kasir (STAFF) dan Admin
router.get('/outlets/:outletId/payment-methods', jwtAuthGuard, paymentMethodController.getActiveMethodsByBranch);

// Hanya bisa diatur oleh Admin
router.post('/outlets/:outletId/payment-methods', jwtAuthGuard, requireRoles('ADMIN'), paymentMethodController.activateInBranch);
router.delete('/outlets/:outletId/payment-methods/:id', jwtAuthGuard, requireRoles('ADMIN'), paymentMethodController.deactivateInBranch);

export default router;
