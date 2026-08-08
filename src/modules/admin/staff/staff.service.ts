import { userRepository } from '../../shared/repositories/user.repository';
import { AppError } from '@common/utils/app-error.util';
import { hashPassword } from '@common/utils/hash.util';
import { CreateStaffType } from './dto/create-staff.dto';
import { UpdateStaffType } from './dto/update-staff.dto';

export class StaffService {
  async getAllStaff({
    requesterBusinessId,
    outletId,
    search,
    page = 1,
    limit = 10,
  }: {
    requesterBusinessId: string;
    outletId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    // Hanya ambil STAFF di bisnis ini
    const { users, total } = await userRepository.findAll({
      businessId: requesterBusinessId,
      outletId,
      role: 'STAFF',
      search,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit);
    return { data: users, meta: { total, page, limit, totalPages } };
  }

  async getStaffById(id: string, requesterBusinessId: string) {
    const user = await userRepository.findById(id);

    if (!user || user.role !== 'STAFF' || user.businessId !== requesterBusinessId) {
      throw new AppError('Staff tidak ditemukan', 404);
    }

    return user;
  }

  async createStaff(data: CreateStaffType, requesterBusinessId: string) {
    // Cek duplikasi username
    const existingByUsername = await userRepository.findByUsername(data.username);
    if (existingByUsername) {
      throw new AppError('Username sudah digunakan', 400);
    }

    // Validasi outlet (jika ada)
    if (data.outletId) {
      const outlet = await userRepository.findOutletByIdAndBusiness(data.outletId, requesterBusinessId);
      if (!outlet) throw new AppError('Outlet tidak ditemukan atau bukan milik Anda', 400);
    }

    // Validasi role (jika ada custom role)
    if (data.roleId) {
      const isValidRole = await userRepository.verifyRoleBelongsToBusiness(data.roleId, requesterBusinessId);
      if (!isValidRole) throw new AppError('Role tidak ditemukan atau bukan milik Anda', 400);
    }

    const hashedPassword = await hashPassword(data.password);

    const newUser = await userRepository.create({
      name: data.name,
      username: data.username,
      phone: data.phone,
      password: hashedPassword,
      role: 'STAFF',
      roleId: data.roleId,
      outletId: data.outletId,
      businessId: requesterBusinessId,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    });

    return newUser;
  }

  async updateStaff(id: string, data: UpdateStaffType, requesterBusinessId: string) {
    const user = await userRepository.findById(id);

    if (!user || user.role !== 'STAFF' || user.businessId !== requesterBusinessId) {
      throw new AppError('Staff tidak ditemukan', 404);
    }

    // Cek duplikasi username jika diubah
    if (data.username && data.username !== user.username) {
      const existingByUsername = await userRepository.findByUsername(data.username);
      if (existingByUsername) throw new AppError('Username sudah digunakan', 400);
    }

    // Validasi outlet (jika diubah)
    if (data.outletId && data.outletId !== user.outletId) {
      const outlet = await userRepository.findOutletByIdAndBusiness(data.outletId, requesterBusinessId);
      if (!outlet) throw new AppError('Outlet tidak valid', 400);
    }

    // Validasi role (jika diubah)
    if (data.roleId && data.roleId !== user.roleId) {
      const isValidRole = await userRepository.verifyRoleBelongsToBusiness(data.roleId, requesterBusinessId);
      if (!isValidRole) throw new AppError('Role tidak valid', 400);
    }

    const updatedUser = await userRepository.update(id, data);
    return updatedUser;
  }

  async deleteStaff(id: string, requesterBusinessId: string) {
    const user = await userRepository.findById(id);

    if (!user || user.role !== 'STAFF' || user.businessId !== requesterBusinessId) {
      throw new AppError('Staff tidak ditemukan', 404);
    }

    await userRepository.softDelete(id);
    return { message: `Staff "${user.name}" berhasil dihapus` };
  }

  async resetPassword(id: string, newPassword: string, requesterBusinessId: string) {
    const user = await userRepository.findById(id);

    if (!user || user.role !== 'STAFF' || user.businessId !== requesterBusinessId) {
      throw new AppError('Staff tidak ditemukan', 404);
    }

    const hashedPassword = await hashPassword(newPassword);
    await userRepository.updatePassword(id, hashedPassword);

    return { message: 'Password staff berhasil di-reset' };
  }
}

export const staffService = new StaffService();
