import { prisma } from '@/prisma/client';
import { userRepository } from '../../shared/repositories/user.repository';
import { AppError } from '@common/utils/app-error.util';
import { hashPassword } from '@common/utils/hash.util';
import { CreateUserType } from './dto/create-user.dto';
import { UpdateUserType } from './dto/update-user.dto';

export class SuperAdminUserService {
  /**
   * Summary untuk halaman Manajemen User (sesuai desain):
   * - totalAdmin : jumlah user dengan role ADMIN yang aktif di semua bisnis
   * - totalKasir : jumlah user dengan role STAFF yang aktif di semua bisnis
   * - totalUser  : total semua user (non-SUPER_ADMIN)
   */
  async getUserSummary() {
    const [totalAdmin, totalKasir, totalUser] = await Promise.all([
      prisma.user.count({
        where: {
          deletedAt: null,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          role: 'STAFF',
          status: 'ACTIVE',
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          role: { not: 'SUPER_ADMIN' },
        },
      }),
    ]);

    return {
      totalAdmin,
      totalKasir,
      totalUser,
    };
  }

  /**
   * List semua user (ADMIN + STAFF) dari seluruh bisnis.
   * Filter opsional: businessId, outletId, role, search
   * Pagination: page & limit
   */
  async getAllUsers({
    businessId,
    outletId,
    role,
    search,
    page = 1,
    limit = 10,
  }: {
    businessId?: string;
    outletId?: string;
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { users, total } = await userRepository.findAll({
      businessId,
      outletId,
      role,
      search,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit);
    return { data: users, meta: { total, page, limit, totalPages } };
  }

  async getUserById(id: string) {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError('User tidak ditemukan', 404);
    }

    return user;
  }

  /**
   * Buat user baru (ADMIN atau STAFF).
   * - Jika role = ADMIN: TIDAK perlu outletId. Admin mengakses semua outlet
   *   via businessId (sama seperti endpoint Outlet yang filter by businessId).
   * - Jika role = STAFF: outletId WAJIB ada (sudah divalidasi di DTO).
   */
  async createUser(data: CreateUserType) {
    // Cek duplikasi email (untuk ADMIN)
    if (data.email) {
      const existingByEmail = await userRepository.findByEmail(data.email);
      if (existingByEmail) {
        throw new AppError('Email sudah terdaftar', 400);
      }
    }

    // Cek duplikasi username (untuk STAFF)
    if (data.username) {
      const existingByUsername = await userRepository.findByUsername(data.username);
      if (existingByUsername) {
        throw new AppError('Username sudah digunakan', 400);
      }
    }

    // Validasi businessId ada
    const business = await prisma.business.findFirst({
      where: { id: data.businessId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!business) {
      throw new AppError('Bisnis tidak ditemukan', 404);
    }

    if (business.status === 'SUSPENDED') {
      throw new AppError('Bisnis sedang dibekukan, tidak bisa menambah user', 400);
    }

    // Validasi outletId — hanya relevan untuk STAFF
    if (data.role === 'STAFF' && data.outletId) {
      const outlet = await prisma.outlet.findFirst({
        where: { id: data.outletId, businessId: data.businessId, deletedAt: null },
        select: { id: true },
      });

      if (!outlet) {
        throw new AppError('Outlet tidak ditemukan atau tidak milik bisnis ini', 404);
      }
    }

    const hashedPassword = await hashPassword(data.password);

    const newUser = await userRepository.create({
      name: data.name,
      username: data.username,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      role: data.role ?? 'ADMIN',
      businessId: data.businessId,
      outletId: data.role === 'STAFF' ? data.outletId : undefined, // Admin tidak diikat ke outlet
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    });

    return newUser;
  }

  /**
   * Update data user — Super Admin bisa ubah nama, phone, status, outletId
   */
  async updateUser(id: string, data: UpdateUserType) {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError('User tidak ditemukan', 404);
    }

    // Jika outletId dikirim, validasi bahwa outlet milik bisnis yang sama
    if (data.outletId && user.businessId) {
      const outlet = await prisma.outlet.findFirst({
        where: { id: data.outletId, businessId: user.businessId, deletedAt: null },
        select: { id: true },
      });

      if (!outlet) {
        throw new AppError('Outlet tidak ditemukan atau tidak milik bisnis ini', 404);
      }
    }

    const updatedUser = await userRepository.update(id, {
      name: data.name,
      phone: data.phone,
      status: data.status,
      // null dikirim frontend untuk melepas outlet → konversi ke undefined agar Prisma tidak update field
      // Namun jika perlu benar-benar melepas outlet, set outletId: null di Prisma secara langsung
      outletId: data.outletId ?? undefined,
    });

    return updatedUser;
  }

  async deleteUser(id: string) {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError('User tidak ditemukan', 404);
    }

    await userRepository.softDelete(id);
    return { message: `User "${user.name}" berhasil dihapus` };
  }
}

export const superAdminUserService = new SuperAdminUserService();
