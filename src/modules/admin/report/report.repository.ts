import { prisma } from '@/prisma/client';
import { Prisma } from '@prisma/client';

export const reportRepository = {
  async getSalesData(businessId: string, startDate: Date, endDate: Date, branchId?: string) {
    const whereClause: Prisma.TransactionWhereInput = {
      status: 'COMPLETED',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      outlet: {
        businessId,
        ...(branchId ? { id: branchId } : {}),
      },
    };

    return prisma.transaction.findMany({
      where: whereClause,
      include: {
        outlet: { select: { name: true } },
        kasir: { select: { name: true } },
        paymentMethod: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getGlobalSalesData(startDate: Date, endDate: Date, branchId?: string, businessId?: string) {
    const whereClause: Prisma.TransactionWhereInput = {
      status: 'COMPLETED',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(branchId ? { outletId: branchId } : {}),
      ...(businessId ? { outlet: { businessId: businessId } } : {}),
    };

    return prisma.transaction.findMany({
      where: whereClause,
      include: {
        outlet: { select: { name: true, business: { select: { name: true } } } },
        kasir: { select: { name: true } },
        paymentMethod: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getTopProductsData(startDate: Date, endDate: Date, branchId?: string, businessId?: string) {
    const whereClause: Prisma.TransactionItemWhereInput = {
      transaction: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(branchId ? { outletId: branchId } : {}),
        ...(businessId ? { outlet: { businessId: businessId } } : {}),
      }
    };

    const topProducts = await prisma.transactionItem.groupBy({
      by: ['productSku', 'productName'],
      where: whereClause,
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
    });

    return topProducts;
  },

  async getStockReportData(branchId?: string, businessId?: string) {
    const whereClause: Prisma.StockWhereInput = {
      ...(branchId ? { outletId: branchId } : {}),
      ...(businessId ? { product: { businessId: businessId } } : {}),
    };

    return prisma.stock.findMany({
      where: whereClause,
      include: {
        product: { select: { name: true, sku: true, category: { select: { name: true } } } },
        outlet: { select: { name: true } },
      },
      orderBy: [
        { outlet: { name: 'asc' } },
        { quantity: 'asc' }
      ]
    });
  }
};
