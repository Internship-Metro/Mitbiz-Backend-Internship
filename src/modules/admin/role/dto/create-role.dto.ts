import { z } from 'zod';
import { MenuPermission } from '@prisma/client';

// Schema untuk satu baris matriks CRUD per menu
export const PermissionMatrixSchema = z.object({
  menu: z.nativeEnum(MenuPermission, { error: 'Menu tidak valid' }),
  canCreate: z.boolean().default(false),
  canRead: z.boolean().default(false),
  canUpdate: z.boolean().default(false),
  canDelete: z.boolean().default(false),
});

export type PermissionMatrixType = z.infer<typeof PermissionMatrixSchema>;

// Validasi khusus: jika ada MENU_POS, tidak boleh ada menu lain
export const roleRefinement = (data: { permissions?: PermissionMatrixType[] }) => {
  if (!data.permissions || data.permissions.length === 0) return true;

  const hasPos = data.permissions.some((p) => p.menu === MenuPermission.MENU_POS);
  if (hasPos && data.permissions.length > 1) {
    return false;
  }
  return true;
};

export const roleRefinementMessage = {
  message: 'MENU_POS tidak dapat digabungkan dengan menu lainnya',
  path: ['permissions'],
};

export const CreateRoleBaseSchema = z.object({
  name: z.string().min(2, 'Nama role minimal 2 karakter').max(50, 'Nama role maksimal 50 karakter'),
  description: z.string().max(200).optional(),
  permissions: z.array(PermissionMatrixSchema).min(1, 'Minimal pilih 1 menu permission'),
});

export const CreateRoleDto = CreateRoleBaseSchema.refine(roleRefinement, roleRefinementMessage);

export type CreateRoleType = z.infer<typeof CreateRoleBaseSchema>; // tanpa refinement agar bisa dipakai di update
