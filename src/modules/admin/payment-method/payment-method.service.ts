import { paymentMethodRepository } from './payment-method.repository';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { AppError } from '@common/utils/app-error.util';

export class PaymentMethodService {
  async getMethodsByBusiness(businessId: string) {
    return paymentMethodRepository.findByBusiness(businessId);
  }

  async getActiveMethodsByBranch(outletId: string, businessId?: string) {
    if (businessId) {
      const validOutlet = await paymentMethodRepository.validateOutletsBelongToBusiness([outletId], businessId);
      if (!validOutlet) throw new AppError('Outlet tidak valid atau bukan milik bisnis Anda.', 403);
    }

    const pivotRecords = await paymentMethodRepository.findActiveByBranch(outletId);
    // Transform agar bentuknya lebih ramah frontend (mereturn array of PaymentMethod)
    return pivotRecords.map((pivot) => pivot.paymentMethod);
  }

  async createMethod(businessId: string, dto: CreatePaymentMethodDto) {
    // 1. Cek duplikasi nama di bisnis yang sama
    const existing = await paymentMethodRepository.findByNameAndBusiness(dto.name, businessId);
    if (existing) {
      throw new AppError(`Metode pembayaran dengan nama '${dto.name}' sudah ada di bisnis ini.`, 400);
    }

    // 2. Validasi array outletIds (pastikan semua milik business ini)
    if (dto.outletIds && dto.outletIds.length > 0) {
      const validOutlets = await paymentMethodRepository.validateOutletsBelongToBusiness(dto.outletIds, businessId);
      if (!validOutlets) {
        throw new AppError('Satu atau lebih Outlet ID tidak valid atau bukan milik bisnis Anda.', 400);
      }
    }

    // 3. Siapkan relasi outlet jika ada array outletIds
    const outletConnections = dto.outletIds?.map((id) => ({
      outletId: id,
      isActive: true,
    })) || [];

    // 3. Simpan ke database
    return paymentMethodRepository.create({
      business: { connect: { id: businessId } },
      name: dto.name,
      type: dto.type,
      details: dto.details,
      isActive: dto.isActive,
      outletPaymentMethods: {
        create: outletConnections, // Langsung otomatis insert ke tabel pivot!
      },
    });
  }

  async updateMethod(businessId: string, id: string, dto: UpdatePaymentMethodDto) {
    // 1. Pastikan metode ini valid dan milik bisnis si Admin
    const existing = await paymentMethodRepository.findById(id);
    if (!existing) {
      throw new AppError('Metode pembayaran tidak ditemukan', 404);
    }
    if (existing.businessId !== businessId) {
      throw new AppError('Anda tidak memiliki akses untuk mengubah metode pembayaran ini.', 403);
    }

    // 2. Cek duplikasi nama jika diubah
    if (dto.name && dto.name !== existing.name) {
      const nameConflict = await paymentMethodRepository.findByNameAndBusiness(dto.name, businessId);
      if (nameConflict) {
        throw new AppError(`Metode pembayaran dengan nama '${dto.name}' sudah ada.`, 400);
      }
    }

    // 3. Update data dasar metode
    const updatedMethod = await paymentMethodRepository.update(id, {
      name: dto.name,
      type: dto.type,
      details: dto.details,
      isActive: dto.isActive,
    });

    // 4. Jika outletIds di-provide, sinkronisasi tabel pivot
    if (dto.outletIds !== undefined) {
      if (dto.outletIds.length > 0) {
        const validOutlets = await paymentMethodRepository.validateOutletsBelongToBusiness(dto.outletIds, businessId);
        if (!validOutlets) {
          throw new AppError('Satu atau lebih Outlet ID tidak valid atau bukan milik bisnis Anda.', 400);
        }
      }
      await paymentMethodRepository.syncOutlets(id, dto.outletIds);
    }

    return updatedMethod;
  }

  async deleteMethod(businessId: string, id: string) {
    const existing = await paymentMethodRepository.findById(id);
    if (!existing) {
      throw new AppError('Metode pembayaran tidak ditemukan', 404);
    }
    if (existing.businessId !== businessId) {
      throw new AppError('Anda tidak memiliki akses untuk menghapus metode pembayaran ini.', 403);
    }

    await paymentMethodRepository.delete(id);
    return { message: 'Metode pembayaran berhasil dihapus.' };
  }

  async activateInBranch(businessId: string, outletId: string, paymentMethodId: string) {
    const validOutlet = await paymentMethodRepository.validateOutletsBelongToBusiness([outletId], businessId);
    if (!validOutlet) throw new AppError('Outlet tidak valid atau bukan milik bisnis Anda.', 400);

    // Pastikan metode milik bisnis
    const method = await paymentMethodRepository.findById(paymentMethodId);
    if (!method || method.businessId !== businessId) {
      throw new AppError('Metode pembayaran tidak valid', 400);
    }

    await paymentMethodRepository.activateInBranch(outletId, paymentMethodId);
    return { message: 'Metode pembayaran berhasil diaktifkan di cabang ini.' };
  }

  async deactivateInBranch(businessId: string, outletId: string, paymentMethodId: string) {
    const validOutlet = await paymentMethodRepository.validateOutletsBelongToBusiness([outletId], businessId);
    if (!validOutlet) throw new AppError('Outlet tidak valid atau bukan milik bisnis Anda.', 400);

    // Pastikan metode milik bisnis
    const method = await paymentMethodRepository.findById(paymentMethodId);
    if (!method || method.businessId !== businessId) {
      throw new AppError('Metode pembayaran tidak valid', 400);
    }
    
    // Pastikan pivot ada sebelum dinonaktifkan
    const pivot = await paymentMethodRepository.findPivot(outletId, paymentMethodId);
    if (!pivot) {
        throw new AppError('Metode pembayaran ini memang tidak aktif di cabang tersebut.', 400);
    }

    await paymentMethodRepository.deactivateInBranch(outletId, paymentMethodId);
    return { message: 'Metode pembayaran berhasil dinonaktifkan dari cabang ini.' };
  }
}

export const paymentMethodService = new PaymentMethodService();
