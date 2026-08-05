import { Prisma, StockAdjustmentType } from '@prisma/client';
import { prisma } from '@/prisma/client';

export class StockRepository {
  /**
   * Mengambil daftar stok untuk suatu outlet.
   * Mendukung pencarian berdasar nama/sku dan filter stok menipis.
   */
  async findAll(outletId: string | undefined, businessId: string | undefined, search?: string, lowStockOnly?: boolean) {
    const where: Prisma.StockWhereInput = {};
    
    if (outletId) {
      where.outletId = outletId;
    } else if (businessId) {
      where.outlet = { businessId };
    }

    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const stocks = await prisma.stock.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            status: true,
            category: { select: { id: true, name: true } },
          },
        },
        outlet: { select: { name: true } },
      },
      orderBy: {
        product: {
          name: 'asc',
        },
      },
    });

    if (lowStockOnly) {
      return stocks.filter((stock) => stock.quantity <= stock.minQuantity);
    }

    return stocks;
  }

  /**
   * Mencari data stok berdasar ID produk secara global (karena productId unik)
   */
  async findByProductId(productId: string) {
    return prisma.stock.findUnique({
      where: {
        productId,
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
            price: true,
            status: true,
          },
        },
        outlet: {
          select: { businessId: true },
        }
      },
    });
  }

  /**
   * Menjalankan transaksi: Update kuantitas stok + insert riwayat.
   */
  async adjustStockTransaction(
    stockId: string,
    outletId: string,
    productId: string,
    newQuantity: number,
    adjustmentQuantity: number, // selisihnya
    type: StockAdjustmentType,
    notes: string,
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Update stok
      const updatedStock = await tx.stock.update({
        where: { id: stockId },
        data: { quantity: newQuantity },
      });

      // 2. Catat riwayat
      const adjustment = await tx.stockAdjustment.create({
        data: {
          outletId,
          productId,
          userId,
          type,
          quantity: adjustmentQuantity,
          notes,
        },
      });

      return { updatedStock, adjustment };
    });
  }

  async findAdjustments(
    outletId: string | undefined,
    businessId: string | undefined,
    skip: number,
    take: number,
    search?: string,
    startDate?: string,
    endDate?: string
  ) {
    const where: Prisma.StockAdjustmentWhereInput = {};
    if (outletId) {
      where.outletId = outletId;
    } else if (businessId) {
      where.outlet = { businessId };
    }

    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, adjustments] = await Promise.all([
      prisma.stockAdjustment.count({ where }),
      prisma.stockAdjustment.findMany({
        where,
        skip,
        take,
        include: {
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
          outlet: { select: { name: true } },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return { total, adjustments };
  }

  /**
   * Mengambil riwayat penyesuaian untuk 1 produk tertentu saja (tanpa pagination)
   */
  async findAdjustmentsByProduct(productId: string, limit: number = 10) {
    return prisma.stockAdjustment.findMany({
      where: {
        productId,
      },
      take: limit,
      include: {
        user: { select: { name: true } },
        outlet: { select: { name: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export const stockRepository = new StockRepository();
