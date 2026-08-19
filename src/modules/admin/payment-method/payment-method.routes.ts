import { Router } from 'express';
import { paymentMethodController } from './payment-method.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { requireActiveSubscription } from '@common/guards/subscription.guard';
import { MenuPermission } from '@prisma/client';

const router = Router();

// ==========================================
// TINGKAT BISNIS (Hanya Admin)
// ==========================================
// Endpoint: /api/v1/payment-methods

router.use('/payment-methods', jwtAuthGuard, requireActiveSubscription);

router.get('/payment-methods', requirePermissions(['MENU_PAYMENT']), paymentMethodController.getMethods);
router.post('/payment-methods', requirePermissions(['MENU_PAYMENT']), paymentMethodController.createMethod);
router.patch('/payment-methods/:id', requirePermissions(['MENU_PAYMENT']), paymentMethodController.updateMethod);
router.delete('/payment-methods/:id', requirePermissions(['MENU_PAYMENT']), paymentMethodController.deleteMethod);


// ==========================================
// TINGKAT CABANG / OUTLET
// ==========================================
// Endpoint: /api/v1/outlets/:outletId/payment-methods

// Bisa diakses oleh Kasir (STAFF) dan Admin
router.get('/outlets/:outletId/payment-methods', jwtAuthGuard, requireActiveSubscription, paymentMethodController.getActiveMethodsByBranch);

// Hanya bisa diatur oleh user yang punya akses MENU_PAYMENT (Admin / Staff yang diberi izin)
router.post('/outlets/:outletId/payment-methods', jwtAuthGuard, requireActiveSubscription, requirePermissions(['MENU_PAYMENT']), paymentMethodController.activateInBranch);
router.delete('/outlets/:outletId/payment-methods/:id', jwtAuthGuard, requireActiveSubscription, requirePermissions(['MENU_PAYMENT']), paymentMethodController.deactivateInBranch);

export default router;
