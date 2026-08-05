import { Router } from 'express';
import { ProductController } from './product.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { uploadSingle } from '@common/middlewares/multer.middleware';
import { MenuPermission } from '@prisma/client';

const router = Router();
const controller = new ProductController();

// Semua rute produk memerlukan login
router.use(jwtAuthGuard);

// GET: Bisa diakses
router.get('/', requirePermissions([MenuPermission.MENU_PRODUCT, MenuPermission.MENU_POS]), controller.getAllProducts);
router.get('/:id', requirePermissions([MenuPermission.MENU_PRODUCT, MenuPermission.MENU_POS]), controller.getProductById);

// POST, PUT, DELETE: Bisa diakses
router.post('/', requirePermissions([MenuPermission.MENU_PRODUCT]), uploadSingle, controller.createProduct);
router.put('/:id', requirePermissions([MenuPermission.MENU_PRODUCT]), uploadSingle, controller.updateProduct);
router.delete('/:id', requirePermissions([MenuPermission.MENU_PRODUCT]), controller.deleteProduct);

export default router;
