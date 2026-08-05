import { Router } from 'express';
import { categoryController } from './category.controller';
import { jwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { requirePermissions } from '@common/guards/permissions.guard';
import { MenuPermission } from '@prisma/client';

const router = Router();

// Semua rute kategori wajib login dan punya outletId
router.use(jwtAuthGuard);
// Secara default, Owner yang tidak punya outletId spesifik (null) tidak bisa 
// memanipulasi kategori cabang langsung via API ini kecuali dia punya cabang.
// Namun di skenario kita, ADMIN dan KASIR adalah pengguna utama modul ini.

// Read/Write access
router.get('/', requirePermissions([MenuPermission.MENU_CATEGORY, MenuPermission.MENU_POS]), categoryController.getCategories);
router.get('/:id', requirePermissions([MenuPermission.MENU_CATEGORY, MenuPermission.MENU_POS]), categoryController.getCategoryById);

// Write access
router.post('/', requirePermissions([MenuPermission.MENU_CATEGORY]), categoryController.createCategory);
router.put('/:id', requirePermissions([MenuPermission.MENU_CATEGORY]), categoryController.updateCategory);
router.delete('/:id', requirePermissions([MenuPermission.MENU_CATEGORY]), categoryController.deleteCategory);

export default router;
