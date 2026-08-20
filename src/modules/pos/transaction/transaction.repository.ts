import { PrismaClient, Prisma, Transaction, TransactionItem, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTransactionInput {
  outletId: string;
  kasirId: string;
  shiftId: string | null;
  invoiceNumber: string;
  orderType: any;
  customerName?: string;
  tableNumber?: string;
  paymentMethodId?: string;
  subtotal: number;
  globalDiscountPercentage?: number | null;
  globalDiscountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  changeAmount: number;
  notes?: string;
  status: TransactionStatus;
  items: {
    productId: string;
    productName: string;
    productSku: string;
    price: number;
    discount: number;
    quantity: number;
    subtotal: number;
  }[];
}

export class TransactionRepository {
  /**
   * Menggunakan Prisma $transaction untuk menjamin atomicity.
   * Jika satu gagal (misal update stok gagal), maka insert transaksi dibatalkan (rollback).
   */
  async createTransactionWithStockDeduction(data: CreateTransactionInput): Promise<Transaction & { items: TransactionItem[] }> {
    return prisma.$transaction(async (tx) => {
      // 1. Insert Transaction Header
      const transaction = await tx.transaction.create({
        data: {
          outletId: data.outletId,
          kasirId: data.kasirId,
          shiftId: data.shiftId,
          paymentMethodId: data.paymentMethodId,
          invoiceNumber: data.invoiceNumber,
          orderType: data.orderType,
          customerName: data.customerName,
          tableNumber: data.tableNumber,
          subtotal: data.subtotal,
          globalDiscountPercentage: data.globalDiscountPercentage,
          globalDiscountAmount: data.globalDiscountAmount,
          taxAmount: data.taxAmount,
          totalAmount: data.totalAmount,
          amountPaid: data.amountPaid,
          changeAmount: data.changeAmount,
          notes: data.notes,
          status: data.status,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productSku: item.productSku,
              price: item.price,
              discount: item.discount,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. Decrement Stocks
      // Stok otomatis berkurang saat transaksi. Riwayat mutasi stok akibat penjualan
      // sudah tercatat di tabel Transaction & TransactionItems — tidak perlu duplikasi
      // ke StockAdjustment. StockAdjustment hanya untuk koreksi manual oleh admin.
      for (const item of data.items) {
        await tx.stock.update({
          where: { productId_outletId: { productId: item.productId, outletId: data.outletId } },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return transaction;
    });
  }

  async findById(id: string, outletId: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: {
        id,
        outletId,
      },
      include: {
        items: true,
        kasir: { select: { id: true, name: true } },
        paymentMethod: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async findManyByOutlet(
    outletId: string,
    filters?: {
      shiftId?: string;
      status?: TransactionStatus;
      startDate?: Date;
      endDate?: Date;
      categoryId?: string;
    }
  ): Promise<Transaction[]> {
    const whereClause: Prisma.TransactionWhereInput = {
      outletId,
    };

    if (filters?.shiftId) whereClause.shiftId = filters.shiftId;
    if (filters?.status) whereClause.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
    }
    // Filter kategori: hanya transaksi yang punya item produk dari kategori ini
    if (filters?.categoryId) {
      whereClause.items = {
        some: { product: { categoryId: filters.categoryId } },
      };
    }

    return prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        kasir: { select: { name: true } },
        outlet: { select: { id: true, name: true } },
        paymentMethod: { select: { name: true, type: true } },
      },
    });
  }

  /**
   * Untuk Admin/Owner: ambil semua transaksi dalam satu bisnis (semua outlet).
   * outletId opsional — jika diisi, filter ke cabang tertentu (dropdown "Semua Cabang").
   * Mengembalikan summary stats sesuai desain UI: Total Penjualan, Transaksi, Diskon, Pajak.
   */
  async findManyByBusiness(
    businessId: string,
    filters?: {
      outletId?: string;
      status?: TransactionStatus;
      startDate?: Date;
      endDate?: Date;
      search?: string;
      categoryId?: string;
    }
  ) {
    const whereClause: Prisma.TransactionWhereInput = {
      outlet: { businessId },
    };

    if (filters?.outletId) whereClause.outletId = filters.outletId;
    if (filters?.status) whereClause.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
    }
    if (filters?.search) {
      whereClause.OR = [
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { kasir: { name: { contains: filters.search, mode: 'insensitive' } } },
        { customerName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    // Filter kategori: hanya transaksi yang punya item produk dari kategori ini
    if (filters?.categoryId) {
      whereClause.items = {
        some: { product: { categoryId: filters.categoryId } },
      };
    }

    const [transactions, aggregate] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          kasir: { select: { name: true } },
          outlet: { select: { id: true, name: true } },
          paymentMethod: { select: { name: true, type: true } },
        },
      }),
      prisma.transaction.aggregate({
        where: { ...whereClause, status: 'COMPLETED' },
        _sum: {
          totalAmount: true,
          globalDiscountAmount: true,
          taxAmount: true,
        },
        _count: { id: true },
      }),
    ]);

    return {
      summary: {
        totalPenjualan: aggregate._sum.totalAmount ?? 0,
        totalTransaksi: aggregate._count.id,
        totalDiskon: aggregate._sum.globalDiscountAmount ?? 0,
        totalPajak: aggregate._sum.taxAmount ?? 0,
      },
      transactions,
    };
  }

  async payPendingTransaction(
    id: string,
    data: {
      paymentMethodId: string;
      amountPaid: number;
      changeAmount: number;
      notes?: string;
    }
  ): Promise<Transaction> {
    return prisma.transaction.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        paymentMethodId: data.paymentMethodId,
        amountPaid: data.amountPaid,
        changeAmount: data.changeAmount,
        notes: data.notes,
      },
    });
  }

  async voidTransaction(
    id: string,
    voidReason: string
  ): Promise<Transaction> {
    // Kita jalankan di dalam transaction untuk merestore stok
    return prisma.$transaction(async (tx) => {
      // 1. Update status
      const transaction = await tx.transaction.update({
        where: { id },
        data: {
          status: 'VOIDED',
          voidedAt: new Date(),
          voidReason,
        },
        include: { items: true },
      });

      // 2. Restore stocks
      // Stok dikembalikan saat void transaksi. Riwayat void sudah tercatat di tabel
      // Transaction (status VOIDED, voidReason). Tidak perlu duplikasi ke StockAdjustment.
      for (const item of transaction.items) {
        await tx.stock.update({
          where: { productId_outletId: { productId: item.productId, outletId: transaction.outletId } },
          data: {
            quantity: { increment: item.quantity },
          },
        });
      }

      return transaction;
    });
  }
}
