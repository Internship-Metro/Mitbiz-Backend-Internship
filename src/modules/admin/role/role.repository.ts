import { PrismaClient } from '@prisma/client';
import { CreateRoleType } from './dto/create-role.dto';
import { UpdateRoleType } from './dto/update-role.dto';

const prisma = new PrismaClient();

export class RoleRepository {
  async create(businessId: string, data: CreateRoleType) {
    return prisma.role.create({
      data: {
        businessId,
        name: data.name,
        description: data.description,
        permissions: {
          create: data.permissions.map((p) => ({
            menu: p.menu,
            canCreate: p.canCreate,
            canRead: p.canRead,
            canUpdate: p.canUpdate,
            canDelete: p.canDelete,
          })),
        },
      },
      include: { permissions: true },
    });
  }

  async findAll(businessId: string) {
    return prisma.role.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: {
        permissions: true,
        _count: {
          select: { users: { where: { deletedAt: null } } },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        _count: {
          select: { users: { where: { deletedAt: null } } },
        },
      },
    });
  }

  async findByNameAndBusiness(name: string, businessId: string) {
    return prisma.role.findUnique({
      where: { businessId_name: { businessId, name } },
    });
  }

  /**
   * Update role: upsert permissions menggunakan deleteMany + createMany
   * agar matriks CRUD selalu bersih saat admin mengubah permission.
   */
  async update(id: string, data: UpdateRoleType) {
    return prisma.$transaction(async (tx) => {
      // Update nama & deskripsi role
      await tx.role.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
        },
      });

      // Jika permissions disertakan, replace seluruh matriks
      if (data.permissions && data.permissions.length > 0) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        await tx.rolePermission.createMany({
          data: data.permissions.map((p) => ({
            roleId: id,
            menu: p.menu,
            canCreate: p.canCreate ?? false,
            canRead: p.canRead ?? false,
            canUpdate: p.canUpdate ?? false,
            canDelete: p.canDelete ?? false,
          })),
        });
      }

      return tx.role.findUnique({
        where: { id },
        include: { permissions: true },
      });
    });
  }

  async delete(id: string) {
    return prisma.role.delete({
      where: { id },
    });
  }

  async countUsersWithRole(id: string) {
    return prisma.user.count({
      where: { roleId: id, deletedAt: null },
    });
  }
}

export const roleRepository = new RoleRepository();
