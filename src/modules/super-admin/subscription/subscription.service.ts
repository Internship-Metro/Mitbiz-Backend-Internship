import { superAdminSubscriptionRepository } from './subscription.repository';

export class SuperAdminSubscriptionService {
  /**
   * Tab "Pelanggan Aktif" — daftar bisnis berlangganan aktif.
   * Menampilkan: nama bisnis, owner, nama paket, status, expired.
   */
  async getActiveSubscribers({
    search,
    page = 1,
    limit = 10,
  }: {
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { total, subscriptions } = await superAdminSubscriptionRepository.findAllActive({
      search,
      page,
      limit,
    });

    const data = subscriptions.map((sub) => ({
      subscriptionId: sub.id,
      businessId: sub.business.id,
      businessName: sub.business.name,
      ownerName: sub.business.users[0]?.name ?? '-',
      packageName: sub.package.name,
      status: sub.status,
      expiredAt: sub.endDate,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Tab "Per Cabang" — per bisnis: paket, cabang digunakan, sisa cabang.
   */
  async getPerCabang({ search }: { search?: string }) {
    const businesses = await superAdminSubscriptionRepository.findPerCabang({ search });

    const data = businesses.map((biz) => {
      const activeSub = biz.subscriptions[0];
      const maxOutlets = activeSub?.package?.maxBranches ?? 0;
      const usedOutlets = biz._count.outlets;
      const remainingOutlets = Math.max(0, maxOutlets - usedOutlets);

      return {
        businessId: biz.id,
        businessName: biz.name,
        packageName: activeSub?.package?.name ?? '-',
        maxOutlets,
        usedOutlets,
        remainingOutlets,
      };
    });

    return { data };
  }
}

export const superAdminSubscriptionService = new SuperAdminSubscriptionService();
