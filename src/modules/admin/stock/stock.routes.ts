import { Router } from 'express';
import { stockController } from './stock.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { MenuPermission } from '@prisma/client';

const stockRouter = Router();

// Semua endpoint stock wajib login dan punya outletId
stockRouter.use(jwtAuthGuard);
stockRouter.use(requirePermissions([MenuPermission.MENU_STOCK]));

// GET /api/v1/stocks
stockRouter.get('/', stockController.getStocks);

// GET /api/v1/stocks/adjustments
stockRouter.get(
  '/adjustments',
  requirePermissions([MenuPermission.MENU_STOCK_ADJUSTMENT]),
  stockController.getAdjustments
);

// POST /api/v1/stocks/adjust
stockRouter.post(
  '/adjust',
  requirePermissions([MenuPermission.MENU_STOCK_ADJUSTMENT]),
  stockController.adjustStock
);

// GET /api/v1/stocks/:productId
stockRouter.get('/:productId', stockController.getStockDetail);

export default stockRouter;
