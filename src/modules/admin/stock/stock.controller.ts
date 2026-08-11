import { Request, Response, NextFunction } from 'express';
import { stockService } from './stock.service';
import { sendSuccess } from '@common/utils/response.util';
import { adjustStockSchema } from './dto/adjust-stock.dto';
import { getStocksQuerySchema, getStockAdjustmentsQuerySchema } from './dto/get-stocks.dto';

export class StockController {
  async getStocks(req: Request, res: Response, next: NextFunction) {
    try {
      const userOutletId = req.user!.outletId || undefined;
      const businessId = req.user!.businessId || undefined;
      const query = getStocksQuerySchema.parse(req.query);

      const stocks = await stockService.getStocks(userOutletId as string | undefined, businessId as string | undefined, query);
      return sendSuccess(res, stocks, 'Berhasil mengambil data stok');
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  async getStockDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const userOutletId = req.user!.outletId || undefined;
      const businessId = req.user!.businessId || undefined;
      const { productId } = req.params;
      // Admin lintas cabang harus kirim outletId via query param
      const queryOutletId = req.query.outletId as string | undefined;

      const stockDetail = await stockService.getStockDetail(
        userOutletId as string | undefined,
        businessId as string | undefined,
        productId as string,
        queryOutletId
      );
      return sendSuccess(res, stockDetail, 'Berhasil mengambil detail stok');
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const userOutletId = req.user!.outletId || undefined;
      const businessId = req.user!.businessId || undefined;
      const userId = req.user!.userId;

      // outletId wajib ada di body (dipilih dari dropdown Cabang di UI)
      const data = adjustStockSchema.parse(req.body);

      const result = await stockService.adjustStock(
        userOutletId as string | undefined,
        businessId as string | undefined,
        userId as string,
        data
      );
      return sendSuccess(res, result, 'Berhasil melakukan penyesuaian stok', 201);
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  async getAdjustments(req: Request, res: Response, next: NextFunction) {
    try {
      const userOutletId = req.user!.outletId || undefined;
      const businessId = req.user!.businessId || undefined;
      const query = getStockAdjustmentsQuerySchema.parse(req.query);

      const result = await stockService.getAdjustments(userOutletId as string | undefined, businessId as string | undefined, query);
      return sendSuccess(res, result, 'Berhasil mengambil riwayat penyesuaian stok');
    } catch (error) {
      next(error);
    }
  }
}

export const stockController = new StockController();
