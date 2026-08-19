import { Router } from 'express';
import { categoryController } from './category.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';

const router = Router();

router.use(jwtAuthGuard);

// GET: Kasir (MENU_POS) dan Admin (MENU_CATEGORY) bisa lihat kategori
router.get(
  '/',
  requirePermissions([
    { menu: 'MENU_CATEGORY', action: 'READ' },
    { menu: 'MENU_POS', action: 'READ' },
  ]),
  categoryController.getCategories
);
router.get(
  '/:id',
  requirePermissions([
    { menu: 'MENU_CATEGORY', action: 'READ' },
    { menu: 'MENU_POS', action: 'READ' },
  ]),
  categoryController.getCategoryById
);

// Write: Hanya yang punya akses MENU_CATEGORY
router.post('/', requirePermissions([{ menu: 'MENU_CATEGORY', action: 'CREATE' }]), categoryController.createCategory);
router.patch('/:id', requirePermissions([{ menu: 'MENU_CATEGORY', action: 'UPDATE' }]), categoryController.updateCategory);
router.delete('/:id', requirePermissions([{ menu: 'MENU_CATEGORY', action: 'DELETE' }]), categoryController.deleteCategory);

export default router;
