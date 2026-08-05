import { PrismaClient, Prisma } from '@prisma/client';
import { CreateRoleType } from './dto/create-role.dto';
import { UpdateRoleType } from './dto/update-role.dto';

const prisma = new PrismaClient();

export class RoleRepository {
  async create(businessId: string, data: CreateRoleType) {
    return prisma.role.create({
      data: {
        businessId,
        name: data.name,
        permissions: data.permissions,
      },
    });
  }

  async findAll(businessId: string) {
    return prisma.role.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: {
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

  async update(id: string, data: UpdateRoleType) {
    return prisma.role.update({
      where: { id },
      data,
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
