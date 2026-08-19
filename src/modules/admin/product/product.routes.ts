import { Router } from 'express';
import { ProductController } from './product.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { uploadSingle } from '@common/middlewares/multer.middleware';

const router = Router();
const controller = new ProductController();

router.use(jwtAuthGuard);

// GET: Kasir (MENU_POS READ) dan Admin (MENU_PRODUCT READ) bisa lihat produk
router.get(
  '/',
  requirePermissions([
    { menu: 'MENU_PRODUCT', action: 'READ' },
    { menu: 'MENU_POS', action: 'READ' },
  ]),
  controller.getAllProducts
);
router.get(
  '/:id',
  requirePermissions([
    { menu: 'MENU_PRODUCT', action: 'READ' },
    { menu: 'MENU_POS', action: 'READ' },
  ]),
  controller.getProductById
);

// Write: Hanya yang punya akses MENU_PRODUCT
router.post('/', requirePermissions([{ menu: 'MENU_PRODUCT', action: 'CREATE' }]), uploadSingle, controller.createProduct);
router.patch('/:id', requirePermissions([{ menu: 'MENU_PRODUCT', action: 'UPDATE' }]), uploadSingle, controller.updateProduct);
router.delete('/:id', requirePermissions([{ menu: 'MENU_PRODUCT', action: 'DELETE' }]), controller.deleteProduct);

export default router;
