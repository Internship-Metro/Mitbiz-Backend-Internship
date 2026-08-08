import { Router } from 'express';
import { TransactionController } from './transaction.controller';
import { jwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { validate } from '../../../common/pipes/zod-validation.pipe';
import {
  createTransactionSchema,
} from './dto/create-transaction.dto';
import { payTransactionSchema } from './dto/pay-transaction.dto';
import { voidTransactionSchema } from './dto/void-transaction.dto';

const router = Router();
const controller = new TransactionController();

router.use(jwtAuthGuard); // Semua route butuh login (Kasir/Admin)

// Kasir: Create transaction & Pay
router.post(
  '/',
  validate(createTransactionSchema),
  controller.createTransaction
);

router.patch(
  '/:id/pay',
  validate(payTransactionSchema),
  controller.payTransaction
);

// Admin / Kasir dengan izin: Void transaction
router.delete(
  '/:id',
  validate(voidTransactionSchema),
  controller.voidTransaction
);

// Read transactions
router.get('/', controller.getTransactions);
router.get('/:id', controller.getTransactionById);

export const transactionRoutes = router;
