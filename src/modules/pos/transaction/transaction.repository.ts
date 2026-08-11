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
  discountAmount: number;
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
          discountAmount: data.discountAmount,
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

      // 2. Decrement Stocks & Catat Stock Adjustment
      for (const item of data.items) {
        // Kurangi stok
        await tx.stock.update({
          where: { productId_outletId: { productId: item.productId, outletId: data.outletId } },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Audit Trail Penjualan
        await tx.stockAdjustment.create({
          data: {
            outletId: data.outletId,
            productId: item.productId,
            userId: data.kasirId,
            type: 'OUT',
            quantity: item.quantity,
            notes: `Terjual di Invoice ${data.invoiceNumber}`,
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

    return prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        kasir: { select: { name: true } },
      },
    });
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

      // 2. Restore stocks & hapus audit trail lama (atau buat audit trail baru tipe IN/CORRECTION)
      // Profesional POS biasanya membuat audit trail baru tipe CORRECTION
      for (const item of transaction.items) {
        await tx.stock.update({
          where: { productId_outletId: { productId: item.productId, outletId: transaction.outletId } },
          data: {
            quantity: { increment: item.quantity },
          },
        });

        await tx.stockAdjustment.create({
          data: {
            outletId: transaction.outletId,
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            notes: `Void Transaksi ${transaction.invoiceNumber}: ${voidReason}`,
          },
        });
      }

      return transaction;
    });
  }
}
