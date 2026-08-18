import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from './subscription.service';
import { sendSuccess } from '@common/utils/response.util';

export class SubscriptionController {
  /**
   * POST /api/v1/subscriptions/subscribe
   * Admin pilih paket → backend buat transaksi Midtrans → return snapToken & redirectUrl
   */
  async subscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { packageId } = req.body;

      const result = await subscriptionService.subscribe(user.businessId, packageId);

      sendSuccess(res, result, 'Transaksi pembayaran berhasil dibuat', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/subscriptions/webhook
   * Endpoint PUBLIC — dipanggil oleh server Midtrans setelah pembayaran selesai.
   * Tidak memerlukan JWT Auth. Keamanannya dijamin oleh verifikasi signature key Midtrans.
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await subscriptionService.handleWebhook(req.body);
      // Midtrans mengharapkan response 200 OK — jika tidak, akan retry terus
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/subscriptions/my
   * Lihat status langganan aktif bisnis yang sedang login
   */
  async getMySubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await subscriptionService.getMySubscription(user.businessId);
      sendSuccess(res, result, 'Berhasil mendapatkan status langganan');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/subscriptions/history
   * Lihat riwayat pembayaran bisnis yang sedang login
   */
  async getPaymentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const history = await subscriptionService.getPaymentHistory(user.businessId);
      sendSuccess(res, history, 'Berhasil mendapatkan riwayat pembayaran');
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionController = new SubscriptionController();
