import { prisma } from '@/prisma/client';
import { UserRole } from '@prisma/client';

export class UserRepository {
  /**
   * Ambil semua user dengan filter, search, dan pagination
   * - Super Admin: lihat semua user dari semua bisnis
   * - Admin: hanya user di bisnis miliknya
   */
  async findAll({
    businessId,
    outletId,
    role,
    search,
    page,
    limit,
  }: {
    businessId?: string;
    outletId?: string;
    role?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      // Jangan tampilkan SUPER_ADMIN di list ini
      role: role
        ? { equals: role as UserRole }
        : { not: 'SUPER_ADMIN' as UserRole },
      ...(businessId && { businessId }),
      ...(outletId && { outletId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          avatarUrl: true,
          lastLoginAt: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
          businessId: true,
          outletId: true,
          roleId: true,
          customRole: { select: { id: true, name: true, permissions: true } },
          business: { select: { id: true, name: true, businessCode: true } },
          outlet: { select: { id: true, name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  /**
   * Cari user by ID (tanpa password)
   */
  async findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        lastLoginAt: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        businessId: true,
        outletId: true,
        roleId: true,
        customRole: { select: { id: true, name: true, permissions: true } },
        business: { select: { id: true, name: true, businessCode: true } },
        outlet: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Cari user by email — dipakai untuk cek duplikat sebelum create
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  /**
   * Buat user baru
   */
  async create(data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
    roleId?: string;
    businessId?: string;
    outletId?: string;
    status: 'ACTIVE' | 'INACTIVE';
    emailVerifiedAt?: Date;
  }) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        businessId: true,
        outletId: true,
        createdAt: true,
      },
    });
  }

  /**
   * Update data user (partial)
   */
  async update(id: string, data: {
    name?: string;
    phone?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    roleId?: string;
    outletId?: string;
    avatarUrl?: string;
  }) {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.roleId !== undefined && { roleId: data.roleId }),
        ...(data.outletId !== undefined && { outletId: data.outletId }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        businessId: true,
        outletId: true,
        roleId: true,
        updatedAt: true,
        customRole: { select: { id: true, name: true } },
        business: { select: { id: true, name: true } },
        outlet: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Soft delete user
   */
  async softDelete(id: string) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  /**
   * Validasi outletId milik businessId yang sama
   */
  async findOutletByIdAndBusiness(outletId: string, businessId: string) {
    return prisma.outlet.findFirst({
      where: { id: outletId, businessId, deletedAt: null },
      select: { id: true, name: true },
    });
  }

  /**
   * Validasi roleId milik businessId yang sama
   */
  async verifyRoleBelongsToBusiness(roleId: string, businessId: string) {
    const role = await prisma.role.findFirst({
      where: { id: roleId, businessId },
      select: { id: true },
    });
    return !!role;
  }
  /**
   * Update password (digunakan untuk fitur reset password)
   */
  async updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { password: passwordHash },
      select: { id: true },
    });
  }
}

export const userRepository = new UserRepository();
