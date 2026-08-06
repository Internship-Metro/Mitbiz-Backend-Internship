import { z } from 'zod';
import { MenuPermission } from '@prisma/client';

export const roleRefinement = (data: { permissions?: MenuPermission[] }) => {
  if (data.permissions && data.permissions.includes(MenuPermission.MENU_POS)) {
    return data.permissions.length === 1;
  }
  return true;
};

export const roleRefinementMessage = {
  message: 'MENU_POS tidak dapat digabungkan dengan menu lainnya',
  path: ['permissions'],
};

export const CreateRoleBaseSchema = z.object({
  name: z.string().min(2, 'Nama role minimal 2 karakter').max(50, 'Nama role maksimal 50 karakter'),
  permissions: z.array(z.nativeEnum(MenuPermission)).min(1, 'Minimal pilih 1 menu permission'),
});

export const CreateRoleDto = CreateRoleBaseSchema.refine(roleRefinement, roleRefinementMessage);

export type CreateRoleType = z.infer<typeof CreateRoleDto>;
