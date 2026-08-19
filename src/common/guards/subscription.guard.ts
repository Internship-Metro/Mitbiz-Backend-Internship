/**
 * src/common/guards/subscription.guard.ts
 *
 * TUJUAN: Middleware untuk memastikan bisnis memiliki langganan aktif
 * sebelum mengakses fitur-fitur operasional.
 *
 * RULES:
 * - SUPER_ADMIN: selalu lolos (tidak terikat bisnis / langganan)
 * - ADMIN / STAFF: wajib punya BusinessSubscription dengan status ACTIVE dan endDate > sekarang
 * - Kasir (STAFF) yang tidak punya businessId di token: resolve dari outletId
 *
 * CARA PAKAI di routes:
 *   router.use(jwtAuthGuard, requireActiveSubscription)
 *   router.post('/products', jwtAuthGuard, requireActiveSubscription, controller.create)
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/prisma/client';
import { sendError } from '@common/utils/response.util';

export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      sendError(res, 'Unauthorized.', 401);
      return;
    }

    // SUPER_ADMIN tidak terikat dengan bisnis/langganan apapun
    if (user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Resolve businessId: ambil langsung dari token, atau fallback via outletId (kasir)
    let businessId = user.businessId;

    if (!businessId && user.outletId) {
      const outlet = await prisma.outlet.findUnique({
        where: { id: user.outletId },
        select: { businessId: true },
      });
      businessId = outlet?.businessId ?? null;
    }

    if (!businessId) {
      sendError(res, 'Akun Anda tidak terikat dengan bisnis manapun.', 403);
      return;
    }

    // Cek langganan aktif di database — filter langsung di DB untuk keamanan berlapis
    const now = new Date();
    const subscription = await prisma.businessSubscription.findFirst({
      where: {
        businessId,
        status: 'ACTIVE',
        endDate: { gt: now }, // Filter expired langsung di DB, tidak hanya di kode
      },
      select: {
        id: true,
        endDate: true,
        package: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Tidak ada langganan aktif (belum beli atau sudah expired)
    if (!subscription) {
      // Cek apakah punya langganan tapi sudah expired, untuk beri pesan yang lebih spesifik
      const expiredSub = await prisma.businessSubscription.findFirst({
        where: { businessId, status: 'ACTIVE' },
        select: { endDate: true, package: { select: { name: true } } },
        orderBy: { endDate: 'desc' },
      });

      if (expiredSub) {
        const expiredDate = expiredSub.endDate.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        sendError(
          res,
          `Langganan paket "${expiredSub.package.name}" Anda telah berakhir pada ${expiredDate}. Silakan perpanjang untuk melanjutkan.`,
          403,
        );
      } else {
        sendError(
          res,
          'Bisnis Anda belum memiliki paket langganan aktif. Silakan beli paket untuk menggunakan fitur ini.',
          403,
        );
      }
      return;
    }

    // Langganan valid — lanjut
    next();
  } catch (error) {
    console.error('[SubscriptionGuard] Error:', error);
    next(error);
  }
};
