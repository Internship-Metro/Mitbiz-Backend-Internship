import { Router } from 'express';
import { paymentMethodController } from './payment-method.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';

const router = Router();

router.use('/payment-methods', jwtAuthGuard);

// ─── TINGKAT BISNIS (hanya yang punya akses MENU_PAYMENT) ────────────────────
router.get('/payment-methods', requirePermissions([{ menu: 'MENU_PAYMENT', action: 'READ' }]), paymentMethodController.getMethods);
router.post('/payment-methods', requirePermissions([{ menu: 'MENU_PAYMENT', action: 'CREATE' }]), paymentMethodController.createMethod);
router.patch('/payment-methods/:id', requirePermissions([{ menu: 'MENU_PAYMENT', action: 'UPDATE' }]), paymentMethodController.updateMethod);
router.delete('/payment-methods/:id', requirePermissions([{ menu: 'MENU_PAYMENT', action: 'DELETE' }]), paymentMethodController.deleteMethod);

// ─── TINGKAT CABANG ───────────────────────────────────────────────────────────
// GET: Terbuka untuk Kasir dan Admin (tidak butuh permission MENU_PAYMENT)
router.get('/outlets/:outletId/payment-methods', jwtAuthGuard, paymentMethodController.getActiveMethodsByBranch);

// Aktivasi/Deaktivasi metode per outlet: butuh MENU_PAYMENT
router.post(
  '/outlets/:outletId/payment-methods',
  jwtAuthGuard,
  requirePermissions([{ menu: 'MENU_PAYMENT', action: 'CREATE' }]),
  paymentMethodController.activateInBranch
);
router.delete(
  '/outlets/:outletId/payment-methods/:id',
  jwtAuthGuard,
  requirePermissions([{ menu: 'MENU_PAYMENT', action: 'DELETE' }]),
  paymentMethodController.deactivateInBranch
);

export default router;
