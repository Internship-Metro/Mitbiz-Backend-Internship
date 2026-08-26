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
    const { search, categoryId, lowStockOnly, outletId } = query;
    const targetOutletId = userOutletId || outletId;

    // kasirMode=true jika outletId berasal dari token kasir (bukan dari query param admin)
    const kasirMode = !!userOutletId;

    const stocks = await stockRepository.findAll(targetOutletId, businessId, search, categoryId, lowStockOnly, kasirMode);
    return stocks;
  }

  /**
   * Mengambil detail satu stok berdasar productId + outletId.
   * - Kasir/Staff terikat cabang: outletId dari token
   * - Admin lintas cabang: outletId dari query param
   */
  async getStockDetail(
    userOutletId: string | undefined,
    businessId: string | undefined,
    productId: string,
    queryOutletId?: string
  ) {
    // Tentukan outletId yang dipakai
    const targetOutletId = userOutletId || queryOutletId;
    if (!targetOutletId) {
      throw new AppError('outletId wajib disertakan (query param) untuk Admin lintas cabang', 400);
    }

    const stock = await stockRepository.findByProductAndOutlet(productId, targetOutletId);
    if (!stock) {
      throw new AppError('Data stok untuk produk ini di cabang yang dipilih tidak ditemukan', 404);
    }

    // Validasi kepemilikan bisnis
    if (businessId && stock.outlet.businessId !== businessId) {
      throw new AppError('Akses ditolak: Produk ini bukan milik bisnis Anda', 403);
    }

    const recentAdjustments = await stockRepository.findAdjustmentsByProduct(productId, 10);
    return { ...stock, recentAdjustments };
  }

  /**
   * Melakukan penyesuaian stok (IN, OUT, CORRECTION).
   * - outletId dari body request (Admin pilih cabang)
   * - Jika user adalah Kasir/Staff terikat cabang, validasi bahwa outletId body = outletId user
   */
  async adjustStock(
    userOutletId: string | undefined,
    businessId: string | undefined,
    userId: string,
    role: string,
    data: AdjustStockDto
  ) {
    const { outletId, productId, type, quantity, notes, isUnlimited } = data;

    // Jika user terikat cabang (Kasir/Staff), pastikan mereka tidak adjust cabang lain
    if (userOutletId && userOutletId !== outletId) {
      throw new AppError(`Akses ditolak: Anda [${role}] hanya bisa melakukan penyesuaian stok di cabang Anda sendiri`, 403);
    }

    // 1. Cek stok produk di cabang yang dipilih
    const stock = await stockRepository.findByProductAndOutlet(productId, outletId);
    if (!stock) {
      throw new AppError('Produk tidak ditemukan di cabang ini atau stok belum diinisialisasi', 404);
    }

    // 2. Validasi kepemilikan bisnis
    if (businessId && stock.outlet.businessId !== businessId) {
      throw new AppError('Akses ditolak: Produk ini bukan milik bisnis Anda', 403);
    }

    // 3. Tentukan newQuantity berdasar tipe
    // NULL = unlimited: stok tidak pernah habis dan tidak akan dikurangi saat transaksi
    let newQuantity: number | null = stock.quantity;

    if (isUnlimited) {
      newQuantity = null; // Set ke null sebagai penanda unlimited
    } else {
      const qty = quantity!; // Dijamin ada karena superRefine sudah validasi
      if (type === 'OUT') {
        if ((stock.quantity ?? 0) < qty) {
          throw new AppError(`Stok tidak mencukupi. Stok saat ini: ${stock.quantity ?? 0}, yang akan dikurangi: ${qty}`, 400);
        }
        newQuantity = (stock.quantity ?? 0) - qty;
      } else if (type === 'IN') {
        newQuantity = (stock.quantity ?? 0) + qty;
      } else if (type === 'CORRECTION') {
        newQuantity = qty;
      }
    }

    // 4. Simpan ke database via transaksi
    const adjustmentQuantity = isUnlimited ? 0 : (type === 'CORRECTION' ? Math.abs((newQuantity ?? 0) - (stock.quantity ?? 0)) : quantity!);

    const result = await stockRepository.adjustStockTransaction(
      stock.id,
      outletId,
      productId,
      newQuantity,
      adjustmentQuantity,
      type,
      notes,
      userId,
      data.minQuantity
    );

    return result.updatedStock;
  }

  /**
   * Mengambil riwayat penyesuaian untuk laporan.
   */
  async getAdjustments(userOutletId: string | undefined, businessId: string | undefined, query: GetStockAdjustmentsQueryDto) {
    const { search, categoryId, startDate, endDate, page = 1, limit = 10, outletId } = query;
    const skip = (page - 1) * limit;

    const targetOutletId = userOutletId || outletId;

    const { total, adjustments } = await stockRepository.findAdjustments(
      targetOutletId,
      businessId,
      skip,
      limit,
      search,
      categoryId,
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
