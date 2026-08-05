import { z } from 'zod';
import { CreateRoleDto } from './create-role.dto';

export const UpdateRoleDto = CreateRoleDto.partial();

export type UpdateRoleType = z.infer<typeof UpdateRoleDto>;
