import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ShiftRepository {
  async findAll({
    businessId,
    outletId,
    kasirId,
    isActive,
    page = 1,
    limit = 10,
  }: {
    businessId?: string;
    outletId?: string;
    kasirId?: string;
    isActive?: string;
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (businessId) {
      where.outlet = { businessId };
    }
    if (outletId) where.outletId = outletId;
    if (kasirId) where.kasirId = kasirId;
    
    if (isActive === 'true') {
      where.closedAt = null;
    } else if (isActive === 'false') {
      where.closedAt = { not: null };
    }

    const [shifts, total] = await prisma.$transaction([
      prisma.shift.findMany({
        where,
        skip,
        take: limit,
        include: {
          kasir: { select: { id: true, name: true, email: true } },
          outlet: { select: { id: true, name: true } },
        },
        orderBy: { openedAt: 'desc' },
      }),
      prisma.shift.count({ where }),
    ]);

    return { shifts, total };
  }

  async findById(id: string) {
    return prisma.shift.findUnique({
      where: { id },
      include: {
        kasir: { select: { id: true, name: true, email: true } },
        outlet: { select: { id: true, name: true, businessId: true } },
      },
    });
  }
}

export const shiftRepository = new ShiftRepository();
