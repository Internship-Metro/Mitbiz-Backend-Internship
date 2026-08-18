import { prisma } from '@/prisma/client';

export class SubscriptionRepository {
  /**
   * Cari paket berdasarkan ID
   */
  async findPackageById(packageId: string) {
    return prisma.package.findUnique({
      where: { id: packageId, isActive: true },
      include: {
        features: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Buat record SubscriptionPayment baru (status PENDING)
   */
  async createPaymentRecord(data: {
    businessId: string;
    packageId: string;
    orderId: string;
    grossAmount: number;
    snapToken?: string;
    redirectUrl?: string;
    expiredAt?: Date;
  }) {
    return prisma.subscriptionPayment.create({ data });
  }

  /**
   * Cari SubscriptionPayment berdasarkan orderId (untuk proses webhook)
   */
  async findPaymentByOrderId(orderId: string) {
    return prisma.subscriptionPayment.findUnique({
      where: { orderId },
      include: {
        business: { select: { id: true, name: true } },
        package: { select: { id: true, name: true, billingCycle: true } },
      },
    });
  }

  /**
   * Update status pembayaran setelah menerima webhook Midtrans
   */
  async updatePaymentStatus(
    orderId: string,
    data: {
      paymentStatus: 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
      paymentType?: string;
      paidAt?: Date;
      subscriptionId?: string;
    },
  ) {
    return prisma.subscriptionPayment.update({
      where: { orderId },
      data,
    });
  }

  /**
   * Buat record BusinessSubscription (aktivasi paket)
   */
  async activateSubscription(data: {
    businessId: string;
    packageId: string;
    endDate: Date;
  }) {
    // Nonaktifkan langganan lama yang masih ACTIVE terlebih dahulu
    await prisma.businessSubscription.updateMany({
      where: { businessId: data.businessId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });

    // Buat langganan baru yang aktif
    return prisma.businessSubscription.create({
      data: {
        businessId: data.businessId,
        packageId: data.packageId,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: data.endDate,
      },
    });
  }

  /**
   * Lihat langganan aktif milik bisnis tertentu
   */
  async findActiveSubscription(businessId: string) {
    return prisma.businessSubscription.findFirst({
      where: { businessId, status: 'ACTIVE' },
      include: {
        package: {
          include: {
            features: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lihat riwayat pembayaran bisnis
   */
  async findPaymentHistory(businessId: string) {
    return prisma.subscriptionPayment.findMany({
      where: { businessId },
      include: {
        package: { select: { id: true, name: true, billingCycle: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const subscriptionRepository = new SubscriptionRepository();
