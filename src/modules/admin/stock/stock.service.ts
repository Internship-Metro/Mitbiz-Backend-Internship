import { stockRepository } from './stock.repository';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { GetStocksQueryDto, GetStockAdjustmentsQueryDto } from './dto/get-stocks.dto';
import { AppError } from '@common/utils/app-error.util';
import { StockAdjustmentType } from '@prisma/client';

export class StockService {
  /**
   * Mengambil semua stok di suatu outlet atau semua outlet dalam satu bisnis.
   */
  async getStocks(userOutletId: string | undefined, businessId: string | undefined, query: any) {
    const { search, lowStockOnly, outletId } = query;
    const targetOutletId = userOutletId || outletId;

    const stocks = await stockRepository.findAll(targetOutletId, businessId, search, lowStockOnly);
    return stocks;
  }

  /**
   * Mengambil detail satu stok beserta riwayat 10 penyesuaian terakhirnya.
   */
  async getStockDetail(userOutletId: string | undefined, businessId: string | undefined, productId: string) {
    const stock = await stockRepository.findByProductId(productId);
    if (!stock) {
      throw new AppError('Data stok untuk produk ini tidak ditemukan', 404);
    }

    if (userOutletId && stock.outletId !== userOutletId) {
      throw new AppError('Akses ditolak: Produk ini bukan milik outlet Anda', 403);
    }
    if (businessId && stock.outlet.businessId !== businessId) {
      throw new AppError('Akses ditolak: Produk ini bukan milik bisnis Anda', 403);
    }

    const recentAdjustments = await stockRepository.findAdjustmentsByProduct(productId, 10);
    return { ...stock, recentAdjustments };
  }

  /**
   * Melakukan penyesuaian stok (IN, OUT, CORRECTION).
   */
  async adjustStock(userOutletId: string | undefined, businessId: string | undefined, userId: string, data: AdjustStockDto) {
    const { productId, type, quantity, notes } = data;

    // 1. Cek stok produk
    const stock = await stockRepository.findByProductId(productId);
    if (!stock) {
      throw new AppError('Produk tidak ditemukan', 404);
    }

    if (userOutletId && stock.outletId !== userOutletId) {
      throw new AppError('Akses ditolak: Produk ini bukan milik outlet Anda', 403);
    }
    if (businessId && stock.outlet.businessId !== businessId) {
      throw new AppError('Akses ditolak: Produk ini bukan milik bisnis Anda', 403);
    }

    // 2. Tentukan newQuantity berdasar tipe
    let newQuantity = stock.quantity;
    
    if (type === 'OUT') {
      if (stock.quantity < quantity) {
        throw new AppError(`Stok tidak mencukupi. Stok saat ini: ${stock.quantity}, yang akan dikurangi: ${quantity}`, 400);
      }
      newQuantity -= quantity;
    } else if (type === 'IN') {
      newQuantity += quantity;
    } else if (type === 'CORRECTION') {
      newQuantity = quantity;
    }

    // 3. Simpan ke database via transaksi
    const adjustmentQuantity = type === 'CORRECTION' ? Math.abs(newQuantity - stock.quantity) : quantity;

    const result = await stockRepository.adjustStockTransaction(
      stock.id,
      stock.outletId,
      productId,
      newQuantity,
      adjustmentQuantity,
      type,
      notes,
      userId
    );

    return result.updatedStock;
  }

  /**
   * Mengambil riwayat penyesuaian untuk laporan.
   */
  async getAdjustments(userOutletId: string | undefined, businessId: string | undefined, query: GetStockAdjustmentsQueryDto) {
    const { search, startDate, endDate, page = 1, limit = 10, outletId } = query;
    const skip = (page - 1) * limit;

    const targetOutletId = userOutletId || outletId;

    const { total, adjustments } = await stockRepository.findAdjustments(
      targetOutletId,
      businessId,
      skip,
      limit,
      search,
      startDate,
      endDate
    );

    return {
      data: adjustments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const stockService = new StockService();
