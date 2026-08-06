import { PrismaClient, PaymentMethod, OutletPaymentMethod, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class PaymentMethodRepository {
  /**
   * Mengambil semua metode pembayaran di tingkat bisnis
   */
  async findByBusiness(businessId: string): Promise<PaymentMethod[]> {
    return prisma.paymentMethod.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: {
        outletPaymentMethods: {
          select: {
            outletId: true,
            isActive: true,
            outlet: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  /**
   * Mengambil satu metode pembayaran berdasarkan ID
   */
  async findById(id: string): Promise<PaymentMethod | null> {
    return prisma.paymentMethod.findUnique({
      where: { id },
      include: {
        outletPaymentMethods: true,
      },
    });
  }

  /**
   * Cek apakah ada metode dengan nama yang sama persis di bisnis yang sama
   */
  async findByNameAndBusiness(name: string, businessId: string): Promise<PaymentMethod | null> {
    return prisma.paymentMethod.findUnique({
      where: {
        businessId_name: {
          businessId,
          name,
        },
      },
    });
  }

  /**
   * Membuat metode pembayaran baru (serta langsung aktifkan di beberapa outlet jika diberikan)
   */
  async create(data: Prisma.PaymentMethodCreateInput): Promise<PaymentMethod> {
    return prisma.paymentMethod.create({
      data,
      include: {
        outletPaymentMethods: true,
      },
    });
  }

  /**
   * Mengubah data metode pembayaran (dan replace outlet jika diperlukan)
   */
  async update(id: string, data: Prisma.PaymentMethodUpdateInput): Promise<PaymentMethod> {
    return prisma.paymentMethod.update({
      where: { id },
      data,
      include: {
        outletPaymentMethods: true,
      },
    });
  }

  /**
   * Menghapus metode pembayaran (Hard delete karena master data terpisah dari transaksi historis)
   */
  async delete(id: string): Promise<void> {
    await prisma.paymentMethod.delete({
      where: { id },
    });
  }

  // ==========================================
  // LOGIKA LEVEL OUTLET / CABANG
  // ==========================================

  /**
   * Mengambil metode pembayaran yang AKTIF di cabang tertentu
   */
  async findActiveByBranch(outletId: string) {
    return prisma.outletPaymentMethod.findMany({
      where: {
        outletId,
        isActive: true,
        paymentMethod: {
          isActive: true, // Pastikan metode globalnya juga aktif
        },
      },
      include: {
        paymentMethod: true,
      },
      orderBy: {
        paymentMethod: {
          name: 'asc',
        },
      },
    });
  }

  /**
   * Cek apakah relasi outlet dan metode sudah ada
   */
  async findPivot(outletId: string, paymentMethodId: string): Promise<OutletPaymentMethod | null> {
    return prisma.outletPaymentMethod.findUnique({
      where: {
        outletId_paymentMethodId: {
          outletId,
          paymentMethodId,
        },
      },
    });
  }

  /**
   * Mengaktifkan metode pembayaran di cabang
   */
  async activateInBranch(outletId: string, paymentMethodId: string): Promise<OutletPaymentMethod> {
    return prisma.outletPaymentMethod.upsert({
      where: {
        outletId_paymentMethodId: { outletId, paymentMethodId },
      },
      update: {
        isActive: true, // Jika sudah ada, cukup aktifkan kembali
      },
      create: {
        outletId,
        paymentMethodId,
        isActive: true,
      },
    });
  }

  /**
   * Menonaktifkan metode pembayaran di cabang (soft de-activate)
   */
  async deactivateInBranch(outletId: string, paymentMethodId: string): Promise<OutletPaymentMethod> {
    return prisma.outletPaymentMethod.update({
      where: {
        outletId_paymentMethodId: { outletId, paymentMethodId },
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Sinkronisasi ulang (replace) semua outlet yang aktif untuk suatu metode pembayaran
   */
  async syncOutlets(paymentMethodId: string, outletIds: string[]): Promise<void> {
    // 1. Matikan semua dulu
    await prisma.outletPaymentMethod.updateMany({
      where: { paymentMethodId },
      data: { isActive: false },
    });

    // 2. Aktifkan yang ada di dalam list (atau buat baru)
    for (const outletId of outletIds) {
      await this.activateInBranch(outletId, paymentMethodId);
    }
  }
}

export const paymentMethodRepository = new PaymentMethodRepository();
