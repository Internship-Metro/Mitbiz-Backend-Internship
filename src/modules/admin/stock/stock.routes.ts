import { Router } from 'express';
import { stockController } from './stock.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';

const stockRouter = Router();

stockRouter.use(jwtAuthGuard);

// GET stok: kasir (MENU_POS READ) dan admin (MENU_STOCK READ) bisa lihat
stockRouter.get(
  '/',
  requirePermissions([
    { menu: 'MENU_STOCK', action: 'READ' },
    { menu: 'MENU_POS', action: 'READ' },
  ]),
  stockController.getStocks
);

// Riwayat adjustment: hanya yang punya MENU_STOCK_ADJUSTMENT READ
stockRouter.get(
  '/adjustments',
  requirePermissions([{ menu: 'MENU_STOCK_ADJUSTMENT', action: 'READ' }]),
  stockController.getAdjustments
);

// Buat adjustment stok: hanya yang punya MENU_STOCK_ADJUSTMENT CREATE
stockRouter.patch(
  '/adjust',
  requirePermissions([{ menu: 'MENU_STOCK_ADJUSTMENT', action: 'CREATE' }]),
  stockController.adjustStock
);

// Detail stok produk: kasir (MENU_POS READ) dan admin (MENU_STOCK READ) bisa lihat
stockRouter.get(
  '/:productId',
  requirePermissions([
    { menu: 'MENU_STOCK', action: 'READ' },
    { menu: 'MENU_POS', action: 'READ' },
  ]),
  stockController.getStockDetail
);

export default stockRouter;
