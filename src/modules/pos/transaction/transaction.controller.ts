import { Request, Response, NextFunction } from 'express';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PayTransactionDto } from './dto/pay-transaction.dto';
import { VoidTransactionDto } from './dto/void-transaction.dto';

export class TransactionController {
  private service: TransactionService;

  constructor() {
    this.service = new TransactionService();
  }

  createTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const kasirId = req.user!.userId;
      const outletId = req.user!.outletId;

      if (!outletId) {
        return res.status(403).json({ success: false, message: 'Admin/Super Admin tidak bisa melakukan transaksi kasir' });
      }

      const payload: CreateTransactionDto = req.body;
      const transaction = await this.service.createTransaction(outletId, kasirId, payload);
      
      res.status(201).json({
        success: true,
        message: 'Transaksi berhasil dibuat',
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = String(req.user!.outletId || req.query.outletId);
      if (!outletId) {
        return res.status(400).json({ success: false, message: 'outletId diperlukan' });
      }

      const filters = {
        shiftId: req.query.shiftId as string,
        status: req.query.status as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const transactions = await this.service.getTransactions(outletId, filters);
      
      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  };

  getTransactionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = String(req.user!.outletId || req.query.outletId);
      if (!outletId) {
        return res.status(400).json({ success: false, message: 'outletId diperlukan' });
      }

      const transaction = await this.service.getTransactionById(outletId, req.params.id as string);
      
      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  payTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = req.user!.outletId;
      if (!outletId) {
        return res.status(403).json({ success: false, message: 'Hanya kasir yang bisa melakukan pembayaran' });
      }

      const payload: PayTransactionDto = req.body;
      const transaction = await this.service.payTransaction(outletId, req.params.id as string, payload);
      
      res.status(200).json({
        success: true,
        message: 'Pembayaran berhasil',
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  voidTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = String(req.user!.outletId || req.query.outletId);
      if (!outletId) {
        return res.status(400).json({ success: false, message: 'outletId diperlukan' });
      }

      const payload: VoidTransactionDto = req.body;
      const transaction = await this.service.voidTransaction(outletId, req.params.id as string, payload);
      
      res.status(200).json({
        success: true,
        message: 'Transaksi berhasil dibatalkan',
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  };
}
