import { roleRepository } from './role.repository';
import { AppError } from '@common/utils/app-error.util';
import { CreateRoleType } from './dto/create-role.dto';
import { UpdateRoleType } from './dto/update-role.dto';

export class RoleService {
  async createRole(data: CreateRoleType, requesterRole: string, requesterBusinessId?: string | null) {
    if (requesterRole !== 'ADMIN' && requesterRole !== 'SUPER_ADMIN') {
      throw new AppError('Hanya Admin yang dapat membuat Role', 403);
    }
    if (!requesterBusinessId) {
      throw new AppError('businessId wajib untuk membuat Role', 400);
    }

    const existing = await roleRepository.findByNameAndBusiness(data.name, requesterBusinessId);
    if (existing) {
      throw new AppError(`Role dengan nama "${data.name}" sudah ada`, 400);
    }

    return roleRepository.create(requesterBusinessId, data);
  }

  async getAllRoles(requesterBusinessId?: string | null) {
    if (!requesterBusinessId) {
      throw new AppError('businessId tidak ditemukan', 400);
    }
    return roleRepository.findAll(requesterBusinessId);
  }

  async getRoleById(id: string, requesterBusinessId?: string | null) {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role tidak ditemukan', 404);

    if (role.businessId !== requesterBusinessId) {
      throw new AppError('Anda tidak memiliki akses ke Role ini', 403);
    }
    return role;
  }

  async updateRole(id: string, data: UpdateRoleType, requesterRole: string, requesterBusinessId?: string | null) {
    if (requesterRole !== 'ADMIN' && requesterRole !== 'SUPER_ADMIN') {
      throw new AppError('Hanya Admin yang dapat mengubah Role', 403);
    }

    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role tidak ditemukan', 404);

    if (role.businessId !== requesterBusinessId) {
      throw new AppError('Anda tidak memiliki akses ke Role ini', 403);
    }
    if (role.isDefault) {
      throw new AppError('Role default bawaan sistem tidak dapat diubah', 403);
    }

    if (data.name && data.name !== role.name) {
      const existing = await roleRepository.findByNameAndBusiness(data.name, role.businessId);
      if (existing) {
        throw new AppError(`Role dengan nama "${data.name}" sudah ada`, 400);
      }
    }

    return roleRepository.update(id, data);
  }

  async deleteRole(id: string, requesterRole: string, requesterBusinessId?: string | null) {
    if (requesterRole !== 'ADMIN' && requesterRole !== 'SUPER_ADMIN') {
      throw new AppError('Hanya Admin yang dapat menghapus Role', 403);
    }

    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role tidak ditemukan', 404);

    if (role.businessId !== requesterBusinessId) {
      throw new AppError('Anda tidak memiliki akses ke Role ini', 403);
    }
    if (role.isDefault) {
      throw new AppError('Role default bawaan sistem tidak dapat dihapus', 403);
    }

    const usersCount = await roleRepository.countUsersWithRole(id);
    if (usersCount > 0) {
      throw new AppError(`Tidak dapat menghapus Role karena masih ada ${usersCount} pengguna yang terhubung`, 400);
    }

    await roleRepository.delete(id);
    return { message: `Role "${role.name}" berhasil dihapus` };
  }
}

export const roleService = new RoleService();
