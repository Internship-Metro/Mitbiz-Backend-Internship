import { prisma } from '@/prisma/client';
import { CreateOutletType } from './dto/create-outlet.dto';
import { UpdateOutletType } from './dto/update-outlet.dto';

export class OutletRepository {
  /**
   * Ambil semua outlet dengan pagination & optional filter
   * - Super Admin: businessId tidak dikirim → ambil semua outlet dari semua bisnis
   * - ADMIN/STAFF (berizin MENU_CABANG): businessId wajib dikirim → hanya outlet milik bisnis sendiri
   */
  async findAll({
    businessId,
    outletId,
    search,
    page,
    limit,
  }: {
    businessId?: string;
    outletId?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null, // Hanya ambil yang belum di-soft delete
      ...(businessId && { businessId }),
      ...(outletId && { id: outletId }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
    };

    const [outlets, total] = await Promise.all([
      prisma.outlet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          business: {
            select: { id: true, name: true, businessCode: true },
          },
          _count: {
            select: {
              users: true,    // Jumlah user di outlet ini
              stocks: true,   // Jumlah stok/produk di outlet ini
            },
          },
        },
      }),
      prisma.outlet.count({ where }),
    ]);

    return { outlets, total };
  }

  /**
   * Ambil detail satu outlet berdasarkan ID
   */
  async findById(id: string) {
    return prisma.outlet.findFirst({
      where: { id, deletedAt: null },
      include: {
        business: {
          select: { id: true, name: true, businessCode: true },
        },
        _count: {
          select: { users: true, stocks: true },
        },
      },
    });
  }

  /**
   * Buat outlet baru
   */
  async create(data: CreateOutletType) {
    return prisma.outlet.create({
      data: {
        businessId: data.businessId!,
        name: data.name,
        address: data.address,
        phone: data.phone,
      },
      include: {
        business: {
          select: { id: true, name: true, businessCode: true },
        },
      },
    });
  }

  /**
   * Update data outlet (partial — hanya field yang dikirim yang diubah)
   */
  async update(id: string, data: UpdateOutletType) {
    return prisma.outlet.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        business: {
          select: { id: true, name: true, businessCode: true },
        },
      },
    });
  }

  /**
   * Soft delete — isi deletedAt, outlet tidak benar-benar dihapus dari DB
   */
  async softDelete(id: string) {
    return prisma.outlet.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  /**
   * Cek apakah bisnis dengan ID tersebut ada dan masih aktif
   * Dipakai saat validasi sebelum buat outlet baru
   */
  async findBusinessById(businessId: string) {
    return prisma.business.findFirst({
      where: { id: businessId, deletedAt: null },
      select: { id: true, name: true, status: true },
    });
  }
}

export const outletRepository = new OutletRepository();
