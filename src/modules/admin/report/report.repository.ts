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

  async getGlobalSalesData(startDate: Date, endDate: Date, branchId?: string) {
    const whereClause: Prisma.TransactionWhereInput = {
      status: 'COMPLETED',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(branchId ? { outletId: branchId } : {}),
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
  }
};
