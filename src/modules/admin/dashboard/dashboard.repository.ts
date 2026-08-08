import { prisma } from '@/prisma/client';

// Helper: timezone offset untuk Asia/Jakarta (UTC+7)
// PostgreSQL menyimpan semua waktu dalam UTC, jadi kita perlu konversi ke WIB
// menggunakan AT TIME ZONE 'Asia/Jakarta' agar pengelompokan per hari akurat.

export const dashboardRepository = {
  // ==============================================================
  // KASIR (STAFF) QUERIES
  // ==============================================================

  /**
   * Ambil statistik shift aktif kasir (Diskon & Pajak hari ini).
   * Digunakan di dashboard kasir ketika shift aktif tapi belum ada transaksi open,
   * atau sebagai ringkasan di atas "Table Management".
   */
  async getStaffShiftStats(shiftId: string) {
    const aggregations = await prisma.transaction.aggregate({
      where: { shiftId, status: 'COMPLETED' },
      _count: { id: true },
      _sum: {
        discountAmount: true,
        taxAmount: true,
        totalAmount: true,
      },
    });

    return {
      totalTransaksi: aggregations._count.id || 0,
      diskonDiberikan: Number(aggregations._sum.discountAmount || 0),
      totalPajak: Number(aggregations._sum.taxAmount || 0),
      totalPendapatan: Number(aggregations._sum.totalAmount || 0),
    };
  },

  /**
   * Ambil semua transaksi PENDING (Open Bill) dalam sebuah shift.
   * Digunakan untuk "Table Management" di dashboard kasir.
   * Setiap item berisi info meja, nama pelanggan, produk yang dipesan, dan total.
   */
  async getStaffOpenBills(shiftId: string) {
    const openBills = await prisma.transaction.findMany({
      where: { shiftId, status: 'PENDING' },
      include: {
        items: {
          select: {
            productName: true,
            quantity: true,
            subtotal: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return openBills.map((bill) => ({
      transactionId: bill.id,
      invoiceNumber: bill.invoiceNumber,
      tableNumber: bill.tableNumber || null,
      customerName: bill.customerName || null,
      createdAt: bill.createdAt,
      items: bill.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
      })),
      totalAmount: Number(bill.totalAmount),
    }));
  },

  // ==============================================================
  // ADMIN QUERIES (Per Business)
  // ==============================================================

  /**
   * Ringkasan utama Admin Dashboard (kartu statistik):
   * - Total Penjualan 30 Hari + jumlah transaksi
   * - Cabang Aktif (beserta total cabang)
   * - Kasir Aktif (beserta total kasir)
   * - Produk Aktif (beserta total produk)
   * Menggunakan timezone Asia/Jakarta untuk penghitungan 30 hari terakhir.
   */
  async getAdminSummary(businessId: string) {
    // Hitung awal 30 hari lalu dalam WIB dengan mengurangi offset UTC+7
    const now = new Date();
    const startOf30DaysUTC = new Date(now);
    startOf30DaysUTC.setDate(startOf30DaysUTC.getDate() - 30);

    const [sales, cabangAktif, cabangTotal, kasirAktif, kasirTotal, produkAktif, produkTotal] =
      await Promise.all([
        // Total Penjualan & Transaksi (30 Hari)
        prisma.transaction.aggregate({
          where: {
            status: 'COMPLETED',
            createdAt: { gte: startOf30DaysUTC },
            outlet: { businessId },
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        // Cabang Aktif
        prisma.outlet.count({
          where: { businessId, status: 'ACTIVE', deletedAt: null },
        }),
        // Total Cabang
        prisma.outlet.count({
          where: { businessId, deletedAt: null },
        }),
        // Kasir Aktif = STAFF aktif yang PUNYA akses MENU_POS di role-nya
        // (bukan semua STAFF — staff gudang/manajer tidak dihitung sebagai kasir)
        prisma.user.count({
          where: {
            businessId,
            status: 'ACTIVE',
            role: 'STAFF',
            deletedAt: null,
            customRole: {
              permissions: { has: 'MENU_POS' },
            },
          },
        }),
        // Total Kasir (semua STAFF dengan akses MENU_POS, aktif atau tidak)
        prisma.user.count({
          where: {
            businessId,
            role: 'STAFF',
            deletedAt: null,
            customRole: {
              permissions: { has: 'MENU_POS' },
            },
          },
        }),
        // Produk Aktif
        prisma.product.count({
          where: { outlet: { businessId }, status: 'ACTIVE', deletedAt: null },
        }),
        // Total Produk
        prisma.product.count({
          where: { outlet: { businessId }, deletedAt: null },
        }),
      ]);

    return {
      totalPenjualan: Number(sales._sum.totalAmount || 0),
      totalTransaksi: sales._count.id || 0,
      cabangAktif,
      cabangTotal,
      kasirAktif,
      kasirTotal,
      produkAktif,
      produkTotal,
    };
  },

  /**
   * Tren penjualan harian untuk Admin.
   * @param businessId - ID bisnis
   * @param days - 7 atau 30 (default 30). Desain Super Admin pakai 7 hari, Admin bisa 30.
   */
  async getAdminTrend(businessId: string, days: number = 30) {
    const trend = await prisma.$queryRaw<{ date: string; amount: bigint }[]>`
      SELECT 
        TO_CHAR(("createdAt" AT TIME ZONE 'Asia/Jakarta')::DATE, 'YYYY-MM-DD') as date,
        SUM("totalAmount") as amount
      FROM "transaction"
      WHERE "status" = 'COMPLETED'
        AND ("createdAt" AT TIME ZONE 'Asia/Jakarta')::DATE >= (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE - INTERVAL '${days - 1} days'
        AND "outletId" IN (SELECT id FROM "outlet" WHERE "businessId" = ${businessId} AND "deletedAt" IS NULL)
      GROUP BY ("createdAt" AT TIME ZONE 'Asia/Jakarta')::DATE
      ORDER BY ("createdAt" AT TIME ZONE 'Asia/Jakarta')::DATE ASC
    `;

    return trend.map((t) => ({
      date: t.date,
      amount: Number(t.amount || 0),
    }));
  },

  /**
   * Total penjualan per cabang (30 hari terakhir) untuk Admin.
   */
  async getAdminPerOutlet(businessId: string) {
    const data = await prisma.$queryRaw<{ outletId: string; outletName: string; amount: bigint }[]>`
      SELECT 
        o.id as "outletId",
        o.name as "outletName",
        COALESCE(SUM(t."totalAmount"), 0) as amount
      FROM "outlet" o
      LEFT JOIN "transaction" t ON t."outletId" = o.id
        AND t."status" = 'COMPLETED'
        AND (t."createdAt" AT TIME ZONE 'Asia/Jakarta')::DATE >= (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE - INTERVAL '29 days'
      WHERE o."businessId" = ${businessId}
        AND o."deletedAt" IS NULL
      GROUP BY o.id, o.name
      ORDER BY amount DESC
    `;

    return data.map((d) => ({
      outletName: d.outletName,
      totalAmount: Number(d.amount || 0),
    }));
  },

  /**
   * Distribusi penjualan per metode pembayaran (30 hari terakhir) untuk Admin.
   */
  async getAdminPerPayment(businessId: string) {
    const data = await prisma.$queryRaw<
      { paymentMethodId: string; paymentName: string; amount: bigint }[]
    >`
      SELECT 
        pm.id as "paymentMethodId",
        pm.name as "paymentName",
        COALESCE(SUM(t."totalAmount"), 0) as amount
      FROM "transaction" t
      JOIN "payment_method" pm ON t."paymentMethodId" = pm.id
      WHERE t."status" = 'COMPLETED'
        AND (t."createdAt" AT TIME ZONE 'Asia/Jakarta')::DATE >= (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE - INTERVAL '29 days'
        AND t."outletId" IN (SELECT id FROM "outlet" WHERE "businessId" = ${businessId} AND "deletedAt" IS NULL)
        AND t."paymentMethodId" IS NOT NULL
      GROUP BY pm.id, pm.name
      ORDER BY amount DESC
    `;

    const total = data.reduce((acc, d) => acc + Number(d.amount), 0);

    return data.map((d) => ({
      paymentMethod: d.paymentName,
      totalAmount: Number(d.amount || 0),
      percentage: total > 0 ? Math.round((Number(d.amount) / total) * 100) : 0,
    }));
  },

  /**
   * Produk terlaris (berdasarkan quantity terjual) 30 hari terakhir.
   * Mengambil Top 5 sesuai desain Figma (donut chart + legend list).
   * Menyertakan field percentage untuk keperluan rendering pie/donut chart.
   */
  async getAdminTopProducts(businessId: string) {
    const data = await prisma.$queryRaw<
      { productName: string; quantitySold: bigint; totalAmount: bigint }[]
    >`
      SELECT 
        ti."productName",
        SUM(ti."quantity") as "quantitySold",
        SUM(ti."subtotal") as "totalAmount"
      FROM "transaction_item" ti
      JOIN "transaction" t ON ti."transactionId" = t.id
      WHERE t."status" = 'COMPLETED'
        AND (t."createdAt" AT TIME ZONE 'Asia/Jakarta')::DATE >= (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE - INTERVAL '29 days'
        AND t."outletId" IN (SELECT id FROM "outlet" WHERE "businessId" = ${businessId} AND "deletedAt" IS NULL)
      GROUP BY ti."productName"
      ORDER BY "quantitySold" DESC
      LIMIT 5
    `;

    const totalQty = data.reduce((acc, d) => acc + Number(d.quantitySold), 0);

    return data.map((d) => ({
      name: d.productName,
      quantitySold: Number(d.quantitySold || 0),
      totalAmount: Number(d.totalAmount || 0),
      percentage: totalQty > 0 ? Math.round((Number(d.quantitySold) / totalQty) * 100) : 0,
    }));
  },

  /**
   * Status setiap outlet milik bisnis ini (untuk section "Status Cabang" di dashboard).
   * Menampilkan nama outlet, status operasional, dan jumlah transaksi hari ini (WIB).
   */
  async getAdminOutletStatus(businessId: string) {
    const data = await prisma.$queryRaw<
      { outletId: string; outletName: string; outletStatus: string; txToday: bigint }[]
    >`
      SELECT 
        o.id as "outletId",
        o.name as "outletName",
        o.status as "outletStatus",
        COUNT(t.id) as "txToday"
      FROM "outlet" o
      LEFT JOIN "transaction" t ON t."outletId" = o.id
        AND t."status" = 'COMPLETED'
        AND (t."createdAt" AT TIME ZONE 'Asia/Jakarta')::DATE = (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE
      WHERE o."businessId" = ${businessId}
        AND o."deletedAt" IS NULL
      GROUP BY o.id, o.name, o.status
      ORDER BY o.name ASC
    `;

    return data.map((d) => ({
      outletId: d.outletId,
      outletName: d.outletName,
      status: d.outletStatus,       // 'ACTIVE' | 'INACTIVE'
      transactionToday: Number(d.txToday || 0),
    }));
  },

  // ==============================================================
  // SUPER ADMIN QUERIES (Global Platform)
  // ==============================================================

  /**
   * Ringkasan global platform untuk Super Admin:
   * - Total Revenue Platform (30 Hari)
   * - Total Tenant Aktif
   * - Total User Aktif
   * - Total Transaksi Platform (30 Hari)
   */
  async getSuperAdminSummary() {
    const [sales, tenantAktif, tenantTotal, userAktif] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.business.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.business.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    ]);

    return {
      totalPendapatan: Number(sales._sum.totalAmount || 0),
      totalTransaksi: sales._count.id || 0,
      tenantAktif,
      tenantTotal,
      userAktif,
    };
  },

  /**
   * Tren revenue harian global platform (30 hari terakhir) untuk Super Admin.
   */
  async getSuperAdminTrend() {
    const trend = await prisma.$queryRaw<{ date: string; amount: bigint }[]>`
      SELECT 
        TO_CHAR(("createdAt" AT TIME ZONE 'Asia/Jakarta')::DATE, 'YYYY-MM-DD') as date,
        SUM("totalAmount") as amount
      FROM "transaction"
      WHERE "status" = 'COMPLETED'
        AND ("createdAt" AT TIME ZONE 'Asia/Jakarta')::DATE >= (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE - INTERVAL '29 days'
      GROUP BY ("createdAt" AT TIME ZONE 'Asia/Jakarta')::DATE
      ORDER BY ("createdAt" AT TIME ZONE 'Asia/Jakarta')::DATE ASC
    `;

    return trend.map((t) => ({
      date: t.date,
      amount: Number(t.amount || 0),
    }));
  },

  /**
   * Top 5 tenant berdasarkan revenue (30 hari terakhir) untuk Super Admin.
   */
  async getSuperAdminTopTenants() {
    const topTenants = await prisma.$queryRaw<
      { businessId: string; businessName: string; amount: bigint; transactionCount: bigint }[]
    >`
      SELECT 
        b.id as "businessId", 
        b.name as "businessName",
        COALESCE(SUM(t."totalAmount"), 0) as amount,
        COUNT(t.id) as "transactionCount"
      FROM "business" b
      LEFT JOIN "outlet" o ON o."businessId" = b.id AND o."deletedAt" IS NULL
      LEFT JOIN "transaction" t ON t."outletId" = o.id
        AND t."status" = 'COMPLETED'
        AND (t."createdAt" AT TIME ZONE 'Asia/Jakarta')::DATE >= (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE - INTERVAL '29 days'
      WHERE b."deletedAt" IS NULL
      GROUP BY b.id, b.name
      ORDER BY amount DESC
      LIMIT 5
    `;

    return topTenants.map((t) => ({
      tenantId: t.businessId,
      tenantName: t.businessName,
      totalAmount: Number(t.amount || 0),
      transactionCount: Number(t.transactionCount || 0),
    }));
  },

  /**
   * Distribusi metode pembayaran global platform (30 hari terakhir) untuk Super Admin.
   */
  async getSuperAdminGlobalPayments() {
    const data = await prisma.$queryRaw<
      { paymentMethodId: string; paymentName: string; amount: bigint }[]
    >`
      SELECT 
        pm.id as "paymentMethodId",
        pm.name as "paymentName",
        COALESCE(SUM(t."totalAmount"), 0) as amount
      FROM "transaction" t
      JOIN "payment_method" pm ON t."paymentMethodId" = pm.id
      WHERE t."status" = 'COMPLETED'
        AND (t."createdAt" AT TIME ZONE 'Asia/Jakarta')::DATE >= (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE - INTERVAL '29 days'
        AND t."paymentMethodId" IS NOT NULL
      GROUP BY pm.id, pm.name
      ORDER BY amount DESC
    `;

    const total = data.reduce((acc, d) => acc + Number(d.amount), 0);

    return data.map((d) => ({
      paymentMethod: d.paymentName,
      totalAmount: Number(d.amount || 0),
      percentage: total > 0 ? Math.round((Number(d.amount) / total) * 100) : 0,
    }));
  },

  /**
   * Statistik detail sebuah tenant spesifik (untuk Super Admin melihat per-tenant).
   * Mengembalikan info langganan aktif, jumlah outlet, kasir, dan transaksi.
   */
  async getSuperAdminTenantDetail(businessId: string) {
    const [business, outletCount, kasirCount, subscription] = await Promise.all([
      prisma.business.findUnique({
        where: { id: businessId },
        select: {
          id: true,
          businessCode: true,
          name: true,
          status: true,
          businessCategory: true,
          city: true,
          province: true,
          createdAt: true,
        },
      }),
      prisma.outlet.count({
        where: { businessId, deletedAt: null },
      }),
      prisma.user.count({
        where: { businessId, role: 'STAFF', deletedAt: null },
      }),
      prisma.businessSubscription.findFirst({
        where: { businessId, status: 'ACTIVE' },
        include: { package: { select: { name: true, billingCycle: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!business) return null;

    return {
      ...business,
      outletCount,
      kasirCount,
      subscription: subscription
        ? {
            packageName: subscription.package.name,
            billingCycle: subscription.package.billingCycle,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
          }
        : null,
    };
  },
};
