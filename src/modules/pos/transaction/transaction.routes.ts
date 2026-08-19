import { Router } from 'express';
import { TransactionController } from './transaction.controller';
import { jwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { requirePermissions } from '../../../common/guards/permissions.guard';
import { validate } from '../../../common/pipes/zod-validation.pipe';
import {
  createTransactionSchema,
} from './dto/create-transaction.dto';
import { payTransactionSchema } from './dto/pay-transaction.dto';
import { voidTransactionSchema } from './dto/void-transaction.dto';

const router = Router();
const controller = new TransactionController();

router.use(jwtAuthGuard);

// Kasir: buat transaksi baru (hanya MENU_POS)
router.post(
  '/',
  requirePermissions([{ menu: 'MENU_POS', action: 'CREATE' }]),
  validate(createTransactionSchema),
  controller.createTransaction
);

// Kasir: bayar transaksi
router.patch(
  '/:id/pay',
  requirePermissions([{ menu: 'MENU_POS', action: 'UPDATE' }]),
  validate(payTransactionSchema),
  controller.payTransaction
);

// Void (batalkan): kasir (MENU_POS) ATAU admin yang punya MENU_TRANSACTION_HISTORY
router.delete(
  '/:id',
  requirePermissions([
    { menu: 'MENU_POS', action: 'DELETE' },
    { menu: 'MENU_TRANSACTION_HISTORY', action: 'DELETE' },
  ]),
  validate(voidTransactionSchema),
  controller.voidTransaction
);

// Read transaksi: kasir (MENU_POS) ATAU admin (MENU_TRANSACTION_HISTORY)
router.get(
  '/',
  requirePermissions([
    { menu: 'MENU_POS', action: 'READ' },
    { menu: 'MENU_TRANSACTION_HISTORY', action: 'READ' },
  ]),
  controller.getTransactions
);
router.get(
  '/:id',
  requirePermissions([
    { menu: 'MENU_POS', action: 'READ' },
    { menu: 'MENU_TRANSACTION_HISTORY', action: 'READ' },
  ]),
  controller.getTransactionById
);

export const transactionRoutes = router;
