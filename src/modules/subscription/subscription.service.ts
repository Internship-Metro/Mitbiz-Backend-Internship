import MidtransClient from 'midtrans-client';
import { subscriptionRepository } from './subscription.repository';
import { AppError } from '@common/utils/app-error.util';
import { env } from '@config/env';

// Inisialisasi Midtrans Snap API client
const snap = new MidtransClient.Snap({
  isProduction: env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: env.MIDTRANS_SERVER_KEY,
  clientKey: env.MIDTRANS_CLIENT_KEY,
});

// Inisialisasi Midtrans Core API (untuk verifikasi webhook)
const coreApi = new MidtransClient.CoreApi({
  isProduction: env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: env.MIDTRANS_SERVER_KEY,
  clientKey: env.MIDTRANS_CLIENT_KEY,
});

export class SubscriptionService {
  /**
   * Admin pilih paket → buat transaksi Midtrans → return snapToken & redirectUrl
   */
  async subscribe(businessId: string, packageId: string) {
    // 1. Pastikan paket ada dan aktif
    const pkg = await subscriptionRepository.findPackageById(packageId);
    if (!pkg) {
      throw new AppError('Paket tidak ditemukan atau sudah tidak aktif', 404);
    }

    // 2. Buat orderId unik
    const orderId = `SUB-${Date.now()}-${businessId.slice(-6)}`;

    // 3. Hitung waktu kedaluwarsa transaksi (24 jam dari sekarang)
    const expiredAt = new Date();
    expiredAt.setHours(expiredAt.getHours() + 24);

    // 4. Buat transaksi ke Midtrans Snap API
    const midtransTransaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: pkg.price,
      },
      customer_details: {},
      expiry: {
        unit: 'hours',
        duration: 24,
      },
      callbacks: {
        notification: `${env.APP_URL}/api/v1/subscriptions/webhook`,
      },
    } as any);

    // 5. Simpan record pembayaran ke database (status PENDING)
    await subscriptionRepository.createPaymentRecord({
      businessId,
      packageId,
      orderId,
      grossAmount: pkg.price,
      snapToken: midtransTransaction.token,
      redirectUrl: midtransTransaction.redirect_url,
      expiredAt,
    });

    return {
      orderId,
      snapToken: midtransTransaction.token,
      redirectUrl: midtransTransaction.redirect_url,
      package: {
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        billingCycle: pkg.billingCycle,
      },
    };
  }

  /**
   * Proses notifikasi Webhook dari Midtrans.
   * Endpoint ini dipanggil secara otomatis oleh server Midtrans setelah pembayaran.
   * WAJIB public (tanpa auth) — keamanan dijamin oleh verifikasi signature key.
   */
  async handleWebhook(notification: Record<string, unknown>) {
    // 1. Verifikasi notifikasi ke Midtrans untuk memastikan keasliannya
    const statusResponse = await (coreApi as any).transaction.notification(notification);

    const orderId = statusResponse.order_id as string;
    const transactionStatus = statusResponse.transaction_status as string;
    const fraudStatus = statusResponse.fraud_status as string;

    // 2. Cari record pembayaran yang sesuai dengan orderId
    const paymentRecord = await subscriptionRepository.findPaymentByOrderId(orderId);
    if (!paymentRecord) {
      throw new AppError(`Record pembayaran dengan orderId "${orderId}" tidak ditemukan`, 404);
    }

    // 3. Tentukan status pembayaran berdasarkan respons Midtrans
    let newStatus: 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
    let paidAt: Date | undefined;

    if (transactionStatus === 'capture') {
      newStatus = fraudStatus === 'accept' ? 'SUCCESS' : 'FAILED';
    } else if (transactionStatus === 'settlement') {
      newStatus = 'SUCCESS';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny') {
      newStatus = 'CANCELLED';
    } else if (transactionStatus === 'expire') {
      newStatus = 'EXPIRED';
    } else if (transactionStatus === 'failure') {
      newStatus = 'FAILED';
    } else {
      // Status lain (pending, dll) — abaikan, tidak perlu diproses
      return { message: `Status "${transactionStatus}" diabaikan` };
    }

    if (newStatus === 'SUCCESS') {
      paidAt = new Date();
    }

    // 4. Jika pembayaran SUKSES → aktifkan paket untuk bisnis tersebut
    let subscriptionId: string | undefined;

    if (newStatus === 'SUCCESS') {
      const pkg = paymentRecord.package;

      // Hitung tanggal akhir langganan berdasarkan siklus tagihan
      const endDate = new Date();
      if (pkg.billingCycle === 'MONTHLY') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const subscription = await subscriptionRepository.activateSubscription({
        businessId: paymentRecord.businessId,
        packageId: paymentRecord.packageId,
        endDate,
      });

      subscriptionId = subscription.id;
    }

    // 5. Update status record pembayaran di database
    await subscriptionRepository.updatePaymentStatus(orderId, {
      paymentStatus: newStatus,
      paymentType: statusResponse.payment_type as string | undefined,
      paidAt,
      ...(subscriptionId && { subscriptionId }),
    });

    return {
      message: `Pembayaran ${orderId} diupdate menjadi ${newStatus}`,
      status: newStatus,
    };
  }

  /**
   * Lihat status langganan aktif milik bisnis yang sedang login
   */
  async getMySubscription(businessId: string) {
    const subscription = await subscriptionRepository.findActiveSubscription(businessId);

    if (!subscription) {
      return {
        hasActiveSubscription: false,
        subscription: null,
      };
    }

    const now = new Date();
    const isExpired = subscription.endDate < now;

    return {
      hasActiveSubscription: !isExpired,
      subscription: {
        ...subscription,
        isExpired,
        daysRemaining: isExpired
          ? 0
          : Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      },
    };
  }

  /**
   * Lihat riwayat pembayaran bisnis yang sedang login
   */
  async getPaymentHistory(businessId: string) {
    return subscriptionRepository.findPaymentHistory(businessId);
  }
}

export const subscriptionService = new SubscriptionService();
