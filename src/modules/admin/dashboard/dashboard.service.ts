import { prisma } from '@/prisma/client';
import { dashboardRepository } from './dashboard.repository';

export const dashboardService = {
  /**
   * Entry point utama dashboard — routing berdasarkan role user.
   *
   * STAFF  → Cek shift aktif (closedAt IS NULL).
   *          Jika tidak ada shift → { shiftActive: false }
   *          Jika ada shift       → tampilkan stats + open bills (Table Management)
   *
   * ADMIN  → Dashboard bisnis: summary 30 hari, trend harian, per cabang,
   *          per metode bayar, produk terlaris.
   *
   * SUPER_ADMIN → Dashboard global platform: summary, trend, top tenants,
   *              distribusi metode bayar.
   *              Bisa juga ?businessId= untuk lihat spesifik tenant (Admin View).
   */
  async getDashboardData(user: {
    id: string;
    role: string;
    businessId: string | null;
    outletId?: string | null;
  }) {
    // ─────────────────────────────────────────────────────────────
    // KASIR (STAFF)
    // ─────────────────────────────────────────────────────────────
    if (user.role === 'STAFF') {
      // Shift aktif = shift milik kasir ini yang belum ditutup (closedAt IS NULL)
      const activeShift = await prisma.shift.findFirst({
        where: {
          kasirId: user.id,
          closedAt: null, // NULL = masih aktif, diisi = sudah ditutup
        },
        include: {
          outlet: {
            select: { id: true, name: true },
          },
        },
      });

      // Jika tidak ada shift aktif → kasir belum mulai kerja
      if (!activeShift) {
        return {
          role: 'STAFF',
          shiftActive: false,
          shift: null,
          stats: null,
          openBills: [],
        };
      }

      // Jalankan kedua query secara paralel untuk performa optimal
      const [stats, openBills] = await Promise.all([
        dashboardRepository.getStaffShiftStats(activeShift.id),
        dashboardRepository.getStaffOpenBills(activeShift.id),
      ]);

      return {
        role: 'STAFF',
        shiftActive: true,
        shift: {
          id: activeShift.id,
          openedAt: activeShift.openedAt,
          outletId: activeShift.outletId,
          outletName: activeShift.outlet.name,
          notes: activeShift.notes,
        },
        stats,
        openBills, // Array transaksi PENDING — ditampilkan sebagai "Table Management"
      };
    }

    // ─────────────────────────────────────────────────────────────
    // ADMIN
    // ─────────────────────────────────────────────────────────────
    if (user.role === 'ADMIN') {
      if (!user.businessId) {
        throw new Error('Admin tidak memiliki relasi dengan Business');
      }

      const [summary, trend, perOutlet, perPayment, topProducts, outletStatus] = await Promise.all([
        dashboardRepository.getAdminSummary(user.businessId),
        dashboardRepository.getAdminTrend(user.businessId, 30),
        dashboardRepository.getAdminPerOutlet(user.businessId),
        dashboardRepository.getAdminPerPayment(user.businessId),
        dashboardRepository.getAdminTopProducts(user.businessId),
        dashboardRepository.getAdminOutletStatus(user.businessId),
      ]);

      return {
        role: 'ADMIN',
        summary,
        trend,
        perOutlet,
        perPayment,
        topProducts,
        outletStatus,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // SUPER ADMIN
    // ─────────────────────────────────────────────────────────────
    if (user.role === 'SUPER_ADMIN') {
      const [summary, trend, topTenants, globalPayments] = await Promise.all([
        dashboardRepository.getSuperAdminSummary(),
        dashboardRepository.getSuperAdminTrend(),
        dashboardRepository.getSuperAdminTopTenants(),
        dashboardRepository.getSuperAdminGlobalPayments(),
      ]);

      return {
        role: 'SUPER_ADMIN',
        summary,
        trend,
        topTenants,
        perPayment: globalPayments,
      };
    }

    return { message: 'Role tidak didukung untuk dashboard' };
  },

  /**
   * Super Admin melihat dashboard spesifik sebuah tenant.
   * Menggabungkan: tenant detail info + statistik admin (summary, trend, dll.)
   */
  async getSuperAdminViewTenant(businessId: string) {
    const [tenantDetail, summary, trend, perOutlet, perPayment, topProducts, outletStatus] = await Promise.all([
      dashboardRepository.getSuperAdminTenantDetail(businessId),
      dashboardRepository.getAdminSummary(businessId),
      dashboardRepository.getAdminTrend(businessId, 7), // Super Admin pakai 7 hari sesuai desain
      dashboardRepository.getAdminPerOutlet(businessId),
      dashboardRepository.getAdminPerPayment(businessId),
      dashboardRepository.getAdminTopProducts(businessId),
      dashboardRepository.getAdminOutletStatus(businessId),
    ]);

    if (!tenantDetail) {
      throw new Error('Tenant tidak ditemukan');
    }

    return {
      role: 'SUPER_ADMIN_VIEW_TENANT',
      tenant: tenantDetail,
      summary,
      trend,
      perOutlet,
      perPayment,
      topProducts,
      outletStatus,
    };
  },
};
