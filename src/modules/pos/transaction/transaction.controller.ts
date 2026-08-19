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
      const kasirOutletId = req.user!.outletId; // Ada jika Kasir, null jika Admin
      const businessId = req.user!.businessId;

      const filters = {
        shiftId: req.query.shiftId as string,
        status: req.query.status as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        search: req.query.search as string,
        outletId: req.query.outletId as string,   // opsional untuk Admin
        categoryId: req.query.categoryId as string, // filter per kategori produk
      };

      let result;
      if (kasirOutletId) {
        // Mode Kasir: hanya lihat transaksi di outletnya sendiri
        result = await this.service.getTransactions({
          mode: 'outlet',
          outletId: kasirOutletId,
          filters,
        });
      } else {
        // Mode Admin/Owner: lihat semua transaksi bisnis + summary stats
        if (!businessId) {
          return res.status(400).json({ success: false, message: 'businessId tidak ditemukan di token' });
        }
        console.log('[DEBUG getTransactions] businessId from token:', businessId);
        result = await this.service.getTransactions({
          mode: 'business',
          businessId,
          filters,
        });
        console.log('[DEBUG getTransactions] totalTransaksi found:', (result as any)?.summary?.totalTransaksi);
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };


  getTransactionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = req.user!.outletId || (req.query.outletId as string);
      if (!outletId) {
        return res.status(400).json({ success: false, message: 'outletId diperlukan. Untuk Admin, sertakan ?outletId=<id>' });
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
      const outletId = req.user!.outletId || (req.query.outletId as string);
      if (!outletId) {
        return res.status(400).json({ success: false, message: 'outletId diperlukan. Untuk Admin, sertakan ?outletId=<id>' });
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
