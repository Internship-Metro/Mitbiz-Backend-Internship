import { userRepository } from '../../shared/repositories/user.repository';
import { AppError } from '@common/utils/app-error.util';
import { hashPassword } from '@common/utils/hash.util';
import { CreateUserType } from './dto/create-user.dto';
import { UpdateUserType } from './dto/update-user.dto';

export class SuperAdminUserService {
  async getAllUsers({
    businessId,
    search,
    page = 1,
    limit = 10,
  }: {
    businessId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    // Super Admin bisa melihat semua ADMIN atau STAFF di seluruh bisnis
    const { users, total } = await userRepository.findAll({
      businessId,
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

  async createUser(data: CreateUserType) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email sudah terdaftar', 400);
    }

    const hashedPassword = await hashPassword(data.password);

    // Super Admin membuat Pemilik Bisnis (ADMIN)
    const newUser = await userRepository.create({
      ...data,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    });

    return newUser;
  }

  async updateUser(id: string, data: UpdateUserType) {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError('User tidak ditemukan', 404);
    }

    const updatedUser = await userRepository.update(id, data);
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
