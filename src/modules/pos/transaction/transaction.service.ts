import { PrismaClient, TransactionStatus, OrderType } from '@prisma/client';
import { AppError } from '../../../common/utils/app-error.util';

const prisma = new PrismaClient();
import { TransactionRepository } from './transaction.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PayTransactionDto } from './dto/pay-transaction.dto';
import { VoidTransactionDto } from './dto/void-transaction.dto';

export class TransactionService {
  private repository: TransactionRepository;

  constructor() {
    this.repository = new TransactionRepository();
  }

  /**
   * Helper untuk menggenerate nomor invoice unik, misal: INV/2026/08/172302302
   */
  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6); // last 6 digits of timestamp
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV/${year}/${month}/${timestamp}${random}`;
  }

  async createTransaction(outletId: string, kasirId: string, payload: CreateTransactionDto) {
    // 1. Dapatkan shift aktif milik kasir di outlet ini
    const activeShift = await prisma.shift.findFirst({
      where: {
        kasirId,
        outletId,
        closedAt: null, // Shift belum ditutup
      },
    });

    // Validasi: Kasir wajib punya shift aktif
    if (!activeShift) {
      throw new AppError('Anda harus membuka shift terlebih dahulu sebelum melakukan transaksi', 400);
    }

    // 2. Dapatkan aturan pajak dari Business level
    const outlet = await prisma.outlet.findUnique({
      where: { id: outletId },
      include: { business: true },
    });
    if (!outlet) throw new AppError('Outlet tidak ditemukan', 404);

    const isTaxEnabled = outlet.business.isTaxEnabled;
    const taxPercentage = outlet.business.taxPercentage || 0;

    // 3. Ambil data produk aktual (Snapshotting harga & validasi stok)
    // Hanya tampilkan produk yang pernah ada di cabang ini (ada record Stock untuk outletId ini)
    let subtotal = 0;
    const snapshotItems = [];

    for (const itemDto of payload.items) {
      // Ambil produk dan stok untuk outlet ini
      const product = await prisma.product.findUnique({
        where: { id: itemDto.productId },
        include: {
          stocks: {
            where: { outletId },
          },
        },
      });

      // Validasi produk milik bisnis yang sama
      if (!product || product.businessId !== outlet.businessId) {
        throw new AppError(`Produk dengan ID ${itemDto.productId} tidak ditemukan di bisnis ini`, 404);
      }

      // Ambil stok khusus untuk outlet ini
      const stockForOutlet = product.stocks[0];
      // Validasi: produk harus pernah ada di cabang ini (ada record Stock)
      if (!stockForOutlet) {
        throw new AppError(`Produk ${product.name} tidak tersedia di cabang ini`, 400);
      }
      if (stockForOutlet.quantity < itemDto.quantity) {
        throw new AppError(`Stok produk ${product.name} tidak mencukupi (Tersisa: ${stockForOutlet.quantity})`, 400);
      }

      // Hitung subtotal per item: (harga * qty) - diskon produk (nominal)
      // Diskon produk disimpan sebagai persentase (0-100), konversi ke nominal
      const discountNominal = Math.round((product.price * (product.discount || 0)) / 100);
      const itemSubtotal = (product.price * itemDto.quantity) - (discountNominal * itemDto.quantity);
      subtotal += itemSubtotal;

      // Buat snapshot (harga & diskon diambil dari database, bukan dari input kasir)
      snapshotItems.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        price: product.price,
        discount: product.discount || 0,
        quantity: itemDto.quantity,
        subtotal: itemSubtotal,
      });
    }

    // 4. Kalkulasi Total Akhir (Backend as Source of Truth)
    // Total = subtotal + pajak (tidak ada diskon per-nota)
    const taxAmount = isTaxEnabled ? Math.round((subtotal * taxPercentage) / 100) : 0;
    const totalAmount = subtotal + taxAmount;

    // 5. Tentukan Status (PENDING atau COMPLETED)
    const amountPaid = payload.amountPaid || 0;
    let status: TransactionStatus = 'PENDING';
    let changeAmount = 0;
    let paymentMethodId = payload.paymentMethodId;

    if (amountPaid > 0) {
      if (amountPaid < totalAmount) {
        throw new AppError(`Uang yang dibayar (Rp ${amountPaid}) kurang dari total tagihan (Rp ${totalAmount})`, 400);
      }
      if (!paymentMethodId) {
        throw new AppError('Metode pembayaran wajib diisi jika langsung dibayar', 400);
      }
      status = 'COMPLETED';
      changeAmount = amountPaid - totalAmount;
    } else {
      // Open bill (PENDING)
      paymentMethodId = undefined; // Belum ada metode pembayaran
    }

    // 6. Simpan ke Database
    const invoiceNumber = this.generateInvoiceNumber();
    const transaction = await this.repository.createTransactionWithStockDeduction({
      outletId,
      kasirId,
      shiftId: activeShift.id,
      invoiceNumber,
      orderType: payload.orderType,
      customerName: payload.customerName,
      tableNumber: payload.tableNumber,
      paymentMethodId,
      subtotal,
      taxAmount,
      totalAmount,
      amountPaid,
      changeAmount,
      notes: payload.notes,
      status,
      items: snapshotItems,
    });

    return transaction;
  }

  async getTransactions(outletId: string, filters: any) {
    return this.repository.findManyByOutlet(outletId, filters);
  }

  async getTransactionById(outletId: string, id: string) {
    const transaction = await this.repository.findById(id, outletId);
    if (!transaction) throw new AppError('Transaksi tidak ditemukan', 404);
    return transaction;
  }

  async payTransaction(outletId: string, id: string, payload: PayTransactionDto) {
    const transaction = await this.getTransactionById(outletId, id);

    if (transaction.status === 'COMPLETED') {
      throw new AppError('Transaksi ini sudah lunas', 400);
    }
    if (transaction.status === 'VOIDED') {
      throw new AppError('Transaksi ini sudah dibatalkan (void)', 400);
    }

    if (payload.amountPaid < transaction.totalAmount) {
      throw new AppError(`Uang yang dibayar (Rp ${payload.amountPaid}) kurang dari total tagihan (Rp ${transaction.totalAmount})`, 400);
    }

    const changeAmount = payload.amountPaid - transaction.totalAmount;
    let newNotes = transaction.notes;
    if (payload.notes) {
      newNotes = transaction.notes ? `${transaction.notes}\n${payload.notes}` : payload.notes;
    }

    return this.repository.payPendingTransaction(id, {
      paymentMethodId: payload.paymentMethodId,
      amountPaid: payload.amountPaid,
      changeAmount,
      notes: newNotes || undefined,
    });
  }

  async voidTransaction(outletId: string, id: string, payload: VoidTransactionDto) {
    const transaction = await this.getTransactionById(outletId, id);

    if (transaction.status === 'VOIDED') {
      throw new AppError('Transaksi ini sudah dibatalkan sebelumnya', 400);
    }

    // Eksekusi void + restore stok
    return this.repository.voidTransaction(id, payload.voidReason);
  }
}
