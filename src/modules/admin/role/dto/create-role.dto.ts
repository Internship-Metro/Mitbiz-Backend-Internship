import { z } from 'zod';
import { MenuPermission } from '@prisma/client';

export const CreateRoleDto = z.object({
  name: z.string().min(2, 'Nama role minimal 2 karakter').max(50, 'Nama role maksimal 50 karakter'),
  permissions: z.array(z.nativeEnum(MenuPermission)).min(1, 'Minimal pilih 1 menu permission'),
});

export type CreateRoleType = z.infer<typeof CreateRoleDto>;
