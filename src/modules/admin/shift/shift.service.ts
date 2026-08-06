import { shiftRepository } from './shift.repository';
import { AppError } from '@common/utils/app-error.util';

export class ShiftService {
  async getAllShifts({
    requesterRole,
    requesterBusinessId,
    businessId,
    outletId,
    kasirId,
    isActive,
    page = 1,
    limit = 10,
  }: {
    requesterRole: string;
    requesterBusinessId?: string | null;
    businessId?: string;
    outletId?: string;
    kasirId?: string;
    isActive?: string;
    page?: number;
    limit?: number;
  }) {
    let resolvedBusinessId = businessId;

    if (requesterRole !== 'SUPER_ADMIN') {
      if (!requesterBusinessId) {
        throw new AppError('Anda tidak memiliki akses bisnis', 403);
      }
      resolvedBusinessId = requesterBusinessId; // Paksa pakai businessId dari token
    }

    const { shifts, total } = await shiftRepository.findAll({
      businessId: resolvedBusinessId,
      outletId,
      kasirId,
      isActive,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit);
    return { data: shifts, meta: { total, page, limit, totalPages } };
  }

  async getShiftById(
    id: string,
    requesterRole: string,
    requesterBusinessId?: string | null,
  ) {
    const shift = await shiftRepository.findById(id);

    if (!shift) throw new AppError('Shift tidak ditemukan', 404);

    if (requesterRole !== 'SUPER_ADMIN') {
      if (shift.outlet.businessId !== requesterBusinessId) {
        throw new AppError('Anda tidak memiliki akses ke shift ini', 403);
      }
    }

    return shift;
  }
}

export const shiftService = new ShiftService();
