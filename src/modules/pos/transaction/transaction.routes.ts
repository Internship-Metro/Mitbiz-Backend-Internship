import { Router } from 'express';
import { TransactionController } from './transaction.controller';
import { jwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { requirePermissions } from '../../../common/guards/permissions.guard';
import { validate } from '../../../common/pipes/zod-validation.pipe';
import { MenuPermission } from '@prisma/client';
import {
  createTransactionSchema,
} from './dto/create-transaction.dto';
import { payTransactionSchema } from './dto/pay-transaction.dto';
import { voidTransactionSchema } from './dto/void-transaction.dto';

const router = Router();
const controller = new TransactionController();

router.use(jwtAuthGuard); // Semua route butuh login (Kasir/Admin)

// Kasir: Create transaction & Pay (Hanya untuk MENU_POS)
router.post(
  '/',
  requirePermissions([MenuPermission.MENU_POS]),
  validate(createTransactionSchema),
  controller.createTransaction
);

router.patch(
  '/:id/pay',
  requirePermissions([MenuPermission.MENU_POS]),
  validate(payTransactionSchema),
  controller.payTransaction
);

// Admin / Kasir dengan izin: Void transaction
router.delete(
  '/:id',
  requirePermissions([MenuPermission.MENU_POS, MenuPermission.MENU_TRANSACTION_HISTORY]),
  validate(voidTransactionSchema),
  controller.voidTransaction
);

// Read transactions
router.get(
  '/', 
  requirePermissions([MenuPermission.MENU_POS, MenuPermission.MENU_TRANSACTION_HISTORY]),
  controller.getTransactions
);
router.get(
  '/:id', 
  requirePermissions([MenuPermission.MENU_POS, MenuPermission.MENU_TRANSACTION_HISTORY]),
  controller.getTransactionById
);

export const transactionRoutes = router;
