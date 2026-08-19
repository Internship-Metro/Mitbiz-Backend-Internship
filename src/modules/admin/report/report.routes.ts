import { Router } from 'express';
import { reportController } from './report.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';

const reportRouter = Router();

reportRouter.use(jwtAuthGuard);
reportRouter.use(requirePermissions([{ menu: 'MENU_REPORT', action: 'READ' }]));

// Export harus sebelum route dengan param
reportRouter.get('/sales/export', reportController.exportSales);
reportRouter.get('/sales', reportController.getSales);
reportRouter.get('/products', reportController.getTopProducts);
reportRouter.get('/stocks', reportController.getStocks);

export default reportRouter;
