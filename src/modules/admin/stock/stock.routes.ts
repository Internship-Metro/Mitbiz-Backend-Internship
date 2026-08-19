import { Router } from 'express';
import { stockController } from './stock.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { requireActiveSubscription } from '@common/guards/subscription.guard';
import { MenuPermission } from '@prisma/client';

const stockRouter = Router();

// Semua endpoint stock wajib login & langganan aktif
stockRouter.use(jwtAuthGuard, requireActiveSubscription);

// GET /api/v1/stocks - kasir (MENU_POS) dan admin (MENU_STOCK) bisa lihat stok
stockRouter.get('/', requirePermissions([MenuPermission.MENU_STOCK, MenuPermission.MENU_POS]), stockController.getStocks);

// GET /api/v1/stocks/adjustments - hanya admin
stockRouter.get(
  '/adjustments',
  requirePermissions([MenuPermission.MENU_STOCK_ADJUSTMENT]),
  stockController.getAdjustments
);

// PATCH /api/v1/stocks/adjust - hanya admin
stockRouter.patch(
  '/adjust',
  requirePermissions([MenuPermission.MENU_STOCK_ADJUSTMENT]),
  stockController.adjustStock
);

// GET /api/v1/stocks/:productId - kasir (MENU_POS) dan admin (MENU_STOCK) bisa lihat detail stok
stockRouter.get('/:productId', requirePermissions([MenuPermission.MENU_STOCK, MenuPermission.MENU_POS]), stockController.getStockDetail);

export default stockRouter;
