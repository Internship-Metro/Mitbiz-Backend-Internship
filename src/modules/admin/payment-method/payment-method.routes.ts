import { Router } from 'express';
import { paymentMethodController } from './payment-method.controller';
import { requireAuth, requireRole } from '@common/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// ==========================================
// TINGKAT BISNIS (Hanya Admin)
// ==========================================
// Endpoint: /api/v1/payment-methods

router.use('/payment-methods', requireAuth);

router.get('/payment-methods', requireRole([UserRole.ADMIN]), paymentMethodController.getMethods);
router.post('/payment-methods', requireRole([UserRole.ADMIN]), paymentMethodController.createMethod);
router.patch('/payment-methods/:id', requireRole([UserRole.ADMIN]), paymentMethodController.updateMethod);
router.delete('/payment-methods/:id', requireRole([UserRole.ADMIN]), paymentMethodController.deleteMethod);


// ==========================================
// TINGKAT CABANG / OUTLET
// ==========================================
// Endpoint: /api/v1/outlets/:outletId/payment-methods

// Bisa diakses oleh Kasir (STAFF) dan Admin
router.get('/outlets/:outletId/payment-methods', requireAuth, paymentMethodController.getActiveMethodsByBranch);

// Hanya bisa diatur oleh Admin
router.post('/outlets/:outletId/payment-methods', requireAuth, requireRole([UserRole.ADMIN]), paymentMethodController.activateInBranch);
router.delete('/outlets/:outletId/payment-methods/:id', requireAuth, requireRole([UserRole.ADMIN]), paymentMethodController.deactivateInBranch);

export default router;
