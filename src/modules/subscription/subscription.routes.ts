import { Router } from 'express';
import { subscriptionController } from './subscription.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requireRoles } from '@common/guards/roles.guard';
import { validate } from '@common/pipes/zod-validation.pipe';
import { SubscribeDto } from './dto/subscribe.dto';

const router = Router();

// ─── Webhook (PUBLIC — tidak pakai JWT Auth) ─────────────────────────────────
// Midtrans akan POST ke sini setelah pembayaran berhasil/gagal/expired.
// Keamanan dijamin oleh verifikasi signature key di dalam service.
router.post('/webhook', subscriptionController.handleWebhook);

// ─── Endpoint Admin (Perlu login sebagai ADMIN) ───────────────────────────────
router.post(
  '/subscribe',
  jwtAuthGuard,
  requireRoles('ADMIN'),
  validate(SubscribeDto),
  subscriptionController.subscribe,
);

router.get(
  '/my',
  jwtAuthGuard,
  requireRoles('ADMIN'),
  subscriptionController.getMySubscription,
);

router.get(
  '/history',
  jwtAuthGuard,
  requireRoles('ADMIN'),
  subscriptionController.getPaymentHistory,
);

export default router;
